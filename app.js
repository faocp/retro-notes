/**
 * RETRO TODO APP - JavaScript
 * Clean, performant vanilla JS implementation
 */

class TodoApp {
    constructor() {
        // DOM Elements
        this.todoInput = document.getElementById('todo-input');
        this.addBtn = document.getElementById('add-btn');
        this.todoList = document.getElementById('todo-list');
        this.taskCount = document.getElementById('task-count');
        this.clearCompletedBtn = document.getElementById('clear-completed-btn');
        this.emptyState = document.getElementById('empty-state');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.themeToggleBtn = document.getElementById('theme-toggle');
        this.themeIcon = document.querySelector('.theme-icon');

        // State
        this.todos = [];
        this.currentFilter = 'all';
        this.currentTheme = 'light';

        // Initialize
        this.loadTodos();
        this.loadTheme();
        this.attachEventListeners();
        this.render();
    }

    /**
     * Attach all event listeners
     */
    attachEventListeners() {
        // Add todo on button click
        this.addBtn.addEventListener('click', () => this.addTodo());

        // Add todo on Enter key
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTodo();
            }
        });

        // Clear completed todos
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());

        // Theme toggle
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

        // Filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Event delegation for todo list
        this.todoList.addEventListener('click', (e) => {
            const todoItem = e.target.closest('.todo-item');
            if (!todoItem) return;

            const todoId = parseInt(todoItem.dataset.id);

            // Toggle complete
            if (e.target.classList.contains('todo-checkbox')) {
                this.toggleTodo(todoId);
            }

            // Delete todo
            if (e.target.classList.contains('todo-delete')) {
                this.deleteTodo(todoId);
            }
        });
    }

    /**
     * Add a new todo
     */
    addTodo() {
        const text = this.todoInput.value.trim();

        if (!text) return;

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.push(todo);
        this.todoInput.value = '';
        this.todoInput.focus();

        this.saveTodos();
        this.render();
    }

    /**
     * Toggle todo completion status
     * @param {number} id - Todo ID
     */
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
        }
    }

    /**
     * Delete a todo
     * @param {number} id - Todo ID
     */
    deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveTodos();
        this.render();
    }

    /**
     * Clear all completed todos
     */
    clearCompleted() {
        const hasCompleted = this.todos.some(t => t.completed);
        if (!hasCompleted) return;

        this.todos = this.todos.filter(t => !t.completed);
        this.saveTodos();
        this.render();
    }

    /**
     * Set current filter
     * @param {string} filter - 'all', 'active', or 'completed'
     */
    setFilter(filter) {
        this.currentFilter = filter;

        // Update active filter button
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.render();
    }

    /**
     * Get filtered todos based on current filter
     * @returns {Array} Filtered todos
     */
    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    }

    /**
     * Render the todo list and update UI
     */
    render() {
        const filteredTodos = this.getFilteredTodos();

        // Show/hide empty state
        if (this.todos.length === 0) {
            this.emptyState.classList.remove('hidden');
            this.todoList.innerHTML = '';
        } else {
            this.emptyState.classList.add('hidden');
            this.renderTodoList(filteredTodos);
        }

        this.updateTaskCount();
    }

    /**
     * Render the todo list items
     * @param {Array} todos - Todos to render
     */
    renderTodoList(todos) {
        if (todos.length === 0 && this.todos.length > 0) {
            // Filter returned no results
            this.todoList.innerHTML = `
                <div class="empty-state">
                    <pre class="ascii-art">
  NO TASKS
  MATCH
  FILTER
                    </pre>
                </div>
            `;
            return;
        }

        this.todoList.innerHTML = todos.map(todo => `
            <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" role="checkbox" aria-checked="${todo.completed}"></div>
                <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                <button class="todo-delete" aria-label="Delete task">DEL</button>
            </li>
        `).join('');
    }

    /**
     * Update the active task counter
     */
    updateTaskCount() {
        const activeCount = this.todos.filter(t => !t.completed).length;
        this.taskCount.textContent = activeCount;
    }

    /**
     * Save todos to localStorage
     */
    saveTodos() {
        try {
            localStorage.setItem('retro-todos', JSON.stringify(this.todos));
        } catch (e) {
            console.error('Failed to save todos:', e);
        }
    }

    /**
     * Load todos from localStorage
     */
    loadTodos() {
        try {
            const stored = localStorage.getItem('retro-todos');
            this.todos = stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load todos:', e);
            this.todos = [];
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Toggle between light and dark theme
     */
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveTheme();
    }

    /**
     * Apply the current theme to the document
     */
    applyTheme() {
        if (this.currentTheme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            this.themeIcon.textContent = '☾';
        } else {
            document.body.removeAttribute('data-theme');
            this.themeIcon.textContent = '☀';
        }
    }

    /**
     * Save theme preference to localStorage
     */
    saveTheme() {
        try {
            localStorage.setItem('retro-theme', this.currentTheme);
        } catch (e) {
            console.error('Failed to save theme:', e);
        }
    }

    /**
     * Load theme preference from localStorage
     */
    loadTheme() {
        try {
            const stored = localStorage.getItem('retro-theme');
            this.currentTheme = stored || 'light';
            this.applyTheme();
        } catch (e) {
            console.error('Failed to load theme:', e);
            this.currentTheme = 'light';
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
