import { Component, OnInit } from '@angular/core';
import { TaskService } from '../tasks.service';

@Component({
  selector: 'app-todo-app',
  templateUrl: './todo-app.component.html',
  styleUrls: ['./todo-app.component.css']
})
export class TodoAppComponent implements OnInit {
  todos: { task: string; date: string }[] = [];
  doingTasks: { task: string; date: string }[] = [];
  doneTasks: { task: string; date: string }[] = [];

  newTodo: any = {};

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    this.fetchTasks();
    this.fetchDoingTasks();
    this.fetchDoneTasks();
  }

  private fetchDoneTasks() {
    this.taskService.getDoneTasks().subscribe(
      (doneTasks) => (this.doneTasks = doneTasks),
      (error) => console.error('Error fetching done tasks:', error)
    );
  }

  private fetchTasks() {
    this.taskService.getTasks().subscribe(
      (tasks) => {
        this.todos = tasks.filter(task => !task.doing && !task.done);
        this.doneTasks = tasks.filter(task => task.done);
      },
      (error) => console.error('Error fetching tasks:', error)
    );
  }

  private fetchDoingTasks() {
    this.taskService.getTasksInDoing().subscribe(
      (doingTasks) => (this.doingTasks = doingTasks),
      (error) => console.error('Error fetching tasks in doing:', error)
    );
  }

  calculateRemainingDays(date: string): string {
    const currentDate = new Date();
    const taskDate = new Date(date);
    const timeDifference = taskDate.getTime() - currentDate.getTime();
    const daysRemaining = Math.ceil(timeDifference / (1000 * 3600 * 24));

    if (daysRemaining > 0) {
      return `(${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining)`;
    } else if (daysRemaining === 0) {
      return '(Due today)';
    } else {
      return '(no date)';
    }
  }

  isTaskCompletedOnTime(date: string): boolean {
    const taskDate = new Date(date);
    const currentDate = new Date();
    return taskDate >= currentDate;
  }

  addTodo() {
    this.taskService.addTask(this.newTodo).subscribe(
      (response) => {
        console.log('Task added successfully', response);
        this.fetchTasks(); // Reload the tasks after adding a new one
      },
      (error) => console.error('Error adding task', error)
    );
  }

  removeTodo(index: number) {
    const taskToRemove = this.todos[index];
    this.taskService.removeTask(taskToRemove).subscribe(
      () => this.fetchTasks(), // Reload the tasks after removing one
      (error) => console.error('Error removing task', error)
    );
  }

  moveToDoing(index: number) {
    const task = this.todos[index];
    this.taskService.moveTaskToDoing(task).subscribe(
      () => {
        // Remove the task from the todos array
        this.todos.splice(index, 1);
        // Reload the doing tasks after moving one
        this.fetchDoingTasks();
      },
      (error) => console.error('Error moving task to Doing', error)
    );
  }

  moveToDone(index: number) {
    const task = this.doingTasks[index];
    this.taskService.moveTaskToDone(task).subscribe(
      () => {
        // Remove the task from the doingTasks array
        this.doingTasks.splice(index, 1);
        // Reload the done tasks after moving one
        this.fetchDoneTasks();
      },
      (error) => console.error('Error moving task to Done', error)
    );
  }

  removeDoingTask(index: number) {
    const taskToRemove = this.doingTasks[index];
    this.taskService.removeDoingTask(taskToRemove).subscribe(
      () => this.doingTasks.splice(index, 1), // Remove the task from the doingTasks array
      (error) => console.error('Error removing task from Doing', error)
    );
  }

  removeDoneTask(index: number) {
    const taskToRemove = this.doneTasks[index];
    this.taskService.removeDoneTask(taskToRemove).subscribe(
      () => this.fetchDoingTasks(), // Reload the doing tasks after removing one
      (error) => console.error('Error removing task from Done', error)
    );
  }
}
