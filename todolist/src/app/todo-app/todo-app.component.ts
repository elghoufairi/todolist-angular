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

  constructor(private taskService: TaskService ) {}

  ngOnInit() {
    this.taskService.getTasks().subscribe(
      (tasks) => {
        // Assign tasks to your component properties (e.g., todos, doingTasks, doneTasks)
        this.todos = tasks.filter(task => !task.doing && !task.done);
        this.doingTasks = tasks.filter(task => task.doing && !task.done);
        this.doneTasks = tasks.filter(task => task.done);
       // Fetch and assign tasks in the 'doing' status
       this.taskService.getTasksInDoing().subscribe(
        (doingTasks) => {
          this.doingTasks = doingTasks;
        },
        (error) => {
          console.error('Error fetching tasks in doing:', error);
          // Handle error if needed
        }
      );
    },
      (error) => {
        console.error('Error fetching tasks:', error);
        // Handle error if needed
      }
    );
  }
  private fetchTasks() {
    this.taskService.getTasks().subscribe(
      (tasks) => {
        this.todos = tasks.filter(task => !task.doing && !task.done);
        this.doneTasks = tasks.filter(task => task.done);
      },
      (error) => {
        console.error('Error fetching tasks:', error);
      }
    );
  }
  private fetchDoingTasks() {
    this.taskService.getTasksInDoing().subscribe(
      (doingTasks) => {
        this.doingTasks = doingTasks;
      },
      (error) => {
        console.error('Error fetching tasks in doing:', error);
      }
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
    // Assuming newTodo has 'task' and 'date' properties
    this.taskService.addTask(this.newTodo).subscribe(
      (response) => {
        console.log('Task added successfully', response);
  
        // Reload the page
        window.location.reload();
      },
      (error) => {
        console.error('Error adding task', error);
      }
    );
  }
  

  removeTodo(index: number) {
    // Update to remove the task from the server
    const taskToRemove = this.todos[index];
    this.taskService.removeTask(taskToRemove).subscribe(
      (response) => {
        console.log('Task removed successfully', response);
        this.todos.splice(index, 1);
      },
      (error) => {
        console.error('Error removing task', error);
      }
    );
  }

  moveToDoing(index: number) {
    console.log('Moving to Doing:', this.todos[index]);
    const task = this.todos[index];
    this.taskService.moveTaskToDoing(task).subscribe(
      (response) => {
        console.log('Task moved to Doing successfully', response);
        this.todos.splice(index, 1);
        this.doingTasks.push(task);
        console.log('Updated lists:', this.todos, this.doingTasks, this.doneTasks);
      },
      (error) => {
        console.error('Error moving task to Doing', error);
      }
    );
  }

moveToDone(index: number) {
  const task = this.doingTasks[index];
  this.doingTasks.splice(index, 1);
  this.doneTasks.push(task);
}

  removeDoingTask(index: number) {
    // Update to remove the task from 'Doing' on the server
    const taskToRemove = this.doingTasks[index];
    this.taskService.removeDoingTask(taskToRemove).subscribe(
      (response) => {
        console.log('Task removed from Doing successfully', response);
        this.doingTasks.splice(index, 1);
      },
      (error) => {
        console.error('Error removing task from Doing', error);
      }
    );
  }

  removeDoneTask(index: number) {
    // Update to remove the task from 'Done' on the server
    const taskToRemove = this.doneTasks[index];
    this.taskService.removeDoneTask(taskToRemove).subscribe(
      (response) => {
        console.log('Task removed from Done successfully', response);
        this.doneTasks.splice(index, 1);
      },
      (error) => {
        console.error('Error removing task from Done', error);
      }
    );
  }
}
