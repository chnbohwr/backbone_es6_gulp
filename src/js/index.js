const { Model, View, Collection, Router, LocalStorage } = Backbone;

const ENTER_KEY = 13; // const
let TodoFilter = ''; // let


class Todo extends Model {
  // *Define some default attributes for the todo.*
  defaults() {
    return {
      title: '',
      completed: false
    };
  }

  // *Toggle the `completed` state of this todo item.*
  toggle() {
    this.save({
      completed: !this.get('completed')
    });
  }
}


// TodoList Collection class
class TodoList extends Collection {

  get model(){
    return Todo;
  }

  get localStorage(){
    return new LocalStorage('todos-traceur-backbone');
  }

  completed() {
    return this.filter(todo => todo.get('completed'));
  }

  // *Filter down the list to only todo items that are still not finished.*
  remaining() {
    return this.without(...this.completed());
  }

  nextOrder() {
    if (!this.length) {
      return 1;
    }
    return this.last().get('order') + 1;
  }

  // *Todos are sorted by their original insertion order.*
  comparator(todo) {
    return todo.get('order');
  }
}

// *Create our global collection of **Todos**.*
const Todos = new TodoList(); // let

// Todo Item View class
class TodoView extends View {

  constructor(options) {
    super(options);
    this.listenTo(this.model, 'change', this.render);
    this.listenTo(this.model, 'destroy', this.remove);
    this.listenTo(this.model, 'visible', this.toggleVisible);
  }

  get tagName() {
    return 'li';
  }

  get template() {
    return _.template($('#item-template').html());
  }

  input() {
    return '';
  }

  get events() {
    return {
      'click .toggle': 'toggleCompleted',
      'dblclick label': 'edit',
      'click .destroy': 'clear',
      'keypress .edit': 'updateOnEnter',
      'blur .edit': 'close'
    };
  }

  // *Re-render the contents of the todo item.*
  render() {
    this.$el.html(this.template(this.model.toJSON()));
    this.$el.toggleClass('completed', this.model.get('completed'));
    this.toggleVisible();
    this.input = this.$('.edit');
    return this;
  }

  toggleVisible() {
    this.$el.toggleClass('hidden', this.isHidden);
  }
  get isHidden() {
    const isCompleted = this.model.get('completed'); // const
    return (// hidden cases only
      (!isCompleted && TodoFilter === 'completed') ||
      (isCompleted && TodoFilter === 'active')
    );
  }
  // *Toggle the `'completed'` state of the model.*
  toggleCompleted() {
    this.model.toggle();
  }
  // *Switch this view into `'editing'` mode, displaying the input field.*
  edit() {
    const value = this.input.val(); // const
    this.$el.addClass('editing');
    this.input.val(value).focus();
  }

  // *Close the `'editing'` mode, saving changes to the todo.*
  close() {
    const title = this.input.val(); // const
    if (title) {
      this.model.save({ title });
    } else {
      this.clear();
    }
    this.$el.removeClass('editing');
  }

  // *If you hit `enter`, we're through editing the item.*
  updateOnEnter(e) {
    if (e.which === ENTER_KEY) {
      this.close();
    }
  }

  // *Remove the item and destroy the model.*
  clear() {
    this.model.destroy();
  }
}

// The Application class
// ---------------------

// *Our overall **AppView** is the top-level piece of UI.*
class AppView extends View {
  constructor() {
    super();
    this.setElement($('#todoapp'), true);
    this.statsTemplate = _.template($('#stats-template').html());
    // *Delegate events for creating new items and clearing completed ones.*

    // *At initialization, we bind to the relevant events on the `Todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting todos that might be saved in localStorage.*
    this.allCheckbox = this.$('#toggle-all')[0];
    this.$input = this.$('#new-todo');
    this.$footer = this.$('#footer');
    this.$main = this.$('#main');

    this.listenTo(Todos, 'add', this.addOne);
    this.listenTo(Todos, 'reset', this.addAll);
    this.listenTo(Todos, 'change:completed', this.filterOne);
    this.listenTo(Todos, 'filter', this.filterAll);
    this.listenTo(Todos, 'all', this.render);

    Todos.fetch();
  }

  get events() {
    return {
      'keypress #new-todo': 'createOnEnter',
      'click #clear-completed': 'clearCompleted',
      'click #toggle-all': 'toggleAllComplete'
    };
  }

  // *Re-rendering the App just means refreshing the statistics— the rest of
  // the app doesn't change.*
  render() {
    const completed = Todos.completed().length; // const
    const remaining = Todos.remaining().length; // const

    if (Todos.length) {
      this.$main.show();
      this.$footer.show();

      this.$footer.html(
        this.statsTemplate({
          completed, remaining
        })
      );

      this.$('#filters li a')
        .removeClass('selected')
        .filter('[href="#/' + (TodoFilter || '') + '"]')
        .addClass('selected');
    } else {
      this.$main.hide();
      this.$footer.hide();
    }

    this.allCheckbox.checked = !remaining;
  }

  // *Add a single todo item to the list by creating a view for it, then
  // appending its element to the `<ul>`.*
  addOne(model) {
    const view = new TodoView({ model }); // const
    $('#todo-list').append(view.render().el);
  }

  // *Add all items in the **Todos** collection at once.*
  addAll() {
    this.$('#todo-list').html('');
    Todos.each(this.addOne, this);
  }

  filterOne(todo) {
    todo.trigger('visible');
  }

  filterAll() {
    Todos.each(this.filterOne, this);
  }

  // *Generate the attributes for a new Todo item.*
  newAttributes() {
    return {
      title: this.$input.val().trim(),
      order: Todos.nextOrder(),
      completed: false
    };
  }

  // *If you hit `enter` in the main input field, create a new **Todo** model,
  // persisting it to localStorage.*
  createOnEnter(e) {
    console.log(e);
    if (e.which !== ENTER_KEY || !this.$input.val().trim()) {
      return;
    }

    Todos.create(this.newAttributes());
    this.$input.val('');
  }

  // *Clear all completed todo items and destroy their models.*
  clearCompleted() {
    _.invoke(Todos.completed(), 'destroy');
    return false;
  }

  toggleAllComplete() {
    const completed = this.allCheckbox.checked; // const
    Todos.each(todo => todo.save({ completed }));
  }
}

// The Filters Router class
// ------------------------

class Filters extends Router {

  constructor() {
    super();
    this.routes = {
      '*filter': 'filter'
    }

    this._bindRoutes();
  }

  filter(param = '') {
    // *Set the current filter to be used.*
    TodoFilter = param;

    // *Trigger a collection filter event, causing hiding/unhiding
    // of Todo view items.*
    Todos.trigger('filter');
  }
}

const appView = new AppView();
new Filters();
Backbone.history.start();

