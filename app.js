/**
 * RETRO TODO APP - JavaScript
 * Clean, performant vanilla JS implementation
 */

class TodoApp {
    constructor() {
        // DOM Elements
        this.todoInput = document.getElementById('todo-input');
        this.dueDateInput = document.getElementById('due-date-input');
        this.addBtn = document.getElementById('add-btn');
        this.todoList = document.getElementById('todo-list');
        this.taskCount = document.getElementById('task-count');
        this.clearCompletedBtn = document.getElementById('clear-completed-btn');
        this.exportBtn = document.getElementById('export-btn');
        this.emptyState = document.getElementById('empty-state');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.themeToggleBtn = document.getElementById('theme-toggle');
        this.themeIcon = document.querySelector('.theme-icon');

        // State
        this.todos = [];
        this.currentFilter = 'all';
        this.currentTheme = 'light';

        // Performance optimizations
        this._escapeDiv = document.createElement('div'); // Reusable div for HTML escaping
        this._todayTimestamp = null; // Cache today's timestamp

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
        if (this.addBtn) {
            this.addBtn.addEventListener('click', () => this.addTodo());
        }

        // Add todo on Enter key
        if (this.todoInput) {
            this.todoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addTodo();
                }
            });
        }

        // Clear completed todos
        if (this.clearCompletedBtn) {
            this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        }

        // Export todos
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => this.exportToMarkdown());
        }

        // Theme toggle
        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        }

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
            createdAt: new Date().toISOString(),
            dueDate: this.dueDateInput.value || null
        };

        this.todos.push(todo);
        this.todoInput.value = '';
        this.dueDateInput.value = '';
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
        let filtered;
        switch (this.currentFilter) {
            case 'active':
                filtered = this.todos.filter(t => !t.completed);
                break;
            case 'completed':
                filtered = this.todos.filter(t => t.completed);
                break;
            default:
                filtered = [...this.todos];
        }

        // Sort: overdue first, then due today, then by due date, then no due date
        return filtered.sort((a, b) => {
            // Completed tasks go to the bottom
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }

            // If both have no due date, maintain original order
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;

            // Sort by due date (earlier dates first)
            return a.dueDate.localeCompare(b.dueDate);
        });
    }

    /**
     * Render the todo list and update UI
     */
    render() {
        // Cache today's timestamp for this render cycle
        this._updateTodayTimestamp();

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
     * Update cached today timestamp (called once per render)
     */
    _updateTodayTimestamp() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        this._todayTimestamp = today.getTime();
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

        this.todoList.innerHTML = todos.map(todo => {
            // Parse due date once and get both status and formatted string
            const dueDateInfo = this._processDueDate(todo.dueDate);
            const dueDateHtml = dueDateInfo.formatted ? `
                <div class="todo-due-date ${dueDateInfo.status}">
                    DUE: ${dueDateInfo.formatted}
                </div>
            ` : '';

            return `
                <li class="todo-item ${todo.completed ? 'completed' : ''} ${dueDateInfo.status}" data-id="${todo.id}">
                    <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" role="checkbox" aria-checked="${todo.completed}"></div>
                    <div class="todo-content">
                        <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                        ${dueDateHtml}
                    </div>
                    <button class="todo-delete" aria-label="Delete task">DEL</button>
                </li>
            `;
        }).join('');
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
     * Process due date - parse once and return status and formatted string
     * @param {string} dueDate - Due date in YYYY-MM-DD format
     * @returns {Object} Object with status and formatted properties
     */
    _processDueDate(dueDate) {
        if (!dueDate) {
            return { status: '', formatted: null };
        }

        const due = new Date(dueDate + 'T00:00:00');
        const dueTimestamp = due.getTime();

        // Determine status using cached today timestamp
        let status = '';
        if (dueTimestamp < this._todayTimestamp) {
            status = 'overdue';
        } else if (dueTimestamp === this._todayTimestamp) {
            status = 'due-today';
        }

        // Format date
        const month = (due.getMonth() + 1).toString().padStart(2, '0');
        const day = due.getDate().toString().padStart(2, '0');
        const year = due.getFullYear();
        const formatted = `${month}/${day}/${year}`;

        return { status, formatted };
    }

    /**
     * Format due date for display (used in export)
     * @param {string} dueDate - Due date in YYYY-MM-DD format
     * @returns {string} Formatted date string
     */
    formatDueDate(dueDate) {
        const date = new Date(dueDate + 'T00:00:00');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        // Use cached div instead of creating new one each time
        this._escapeDiv.textContent = text;
        return this._escapeDiv.innerHTML;
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
            if (this.themeIcon) {
                this.themeIcon.textContent = '☾';
            }
        } else {
            document.body.removeAttribute('data-theme');
            if (this.themeIcon) {
                this.themeIcon.textContent = '☀';
            }
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

    /**
     * Export todos to markdown text file
     */
    exportToMarkdown() {
        if (this.todos.length === 0) {
            alert('No tasks to export!');
            return;
        }

        const activeTodos = this.todos.filter(t => !t.completed);
        const completedTodos = this.todos.filter(t => t.completed);

        // Generate markdown content
        let markdown = '# TODO.EXE - Task Export\n\n';
        markdown += `Export Date: ${new Date().toLocaleString()}\n\n`;
        markdown += '---\n\n';

        // Statistics
        markdown += '## Statistics\n\n';
        markdown += `- Total Tasks: ${this.todos.length}\n`;
        markdown += `- Active Tasks: ${activeTodos.length}\n`;
        markdown += `- Completed Tasks: ${completedTodos.length}\n\n`;
        markdown += '---\n\n';

        // Active tasks
        if (activeTodos.length > 0) {
            markdown += '## Active Tasks\n\n';
            activeTodos.forEach(todo => {
                const dueDateInfo = todo.dueDate ? ` (Due: ${this.formatDueDate(todo.dueDate)})` : '';
                markdown += `- [ ] ${todo.text}${dueDateInfo}\n`;
            });
            markdown += '\n';
        }

        // Completed tasks
        if (completedTodos.length > 0) {
            markdown += '## Completed Tasks\n\n';
            completedTodos.forEach(todo => {
                const dueDateInfo = todo.dueDate ? ` (Due: ${this.formatDueDate(todo.dueDate)})` : '';
                markdown += `- [x] ${todo.text}${dueDateInfo}\n`;
            });
            markdown += '\n';
        }

        markdown += '---\n\n';
        markdown += '*Generated by TODO.EXE v1.1*\n';

        // Create download
        const blob = new Blob([markdown], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filename = `todos-${new Date().toISOString().split('T')[0]}.txt`;

        a.href = url;
        a.download = filename;
        a.click();

        // Cleanup
        URL.revokeObjectURL(url);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
