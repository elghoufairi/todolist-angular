import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = 'http://localhost:3000/tasks';
  private doingTasksUrl = 'http://localhost:3000/doing-tasks'; 

  constructor(private http: HttpClient) {}

  getTasks(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Add a new method to get tasks specifically from 'doing' status
  getTasksInDoing(): Observable<any[]> {
    return this.http.get<any[]>(this.doingTasksUrl);
  }

  addTask(task: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, task);
  }
  

  removeTask(task: any): Observable<any> {
    const url = `${this.apiUrl}/${task.status}/${task.id}`;
    return this.http.delete<any>(url);
  }
  
  moveTaskToDoing(task: any): Observable<any> {
    const url = `${this.apiUrl}/move-to-doing/${task.id}`; // Assuming each task has an 'id' property
    return this.http.put<any>(url, {});
  }
  

  moveTaskToDone(task: any): Observable<any> {
    const url = `${this.apiUrl}/move-to-done/${task.id}`;
    return this.http.put<any>(url, {});
  }

  removeDoingTask(task: any): Observable<any> {
    const url = `${this.apiUrl}/remove-doing/${task.id}`;
    return this.http.delete<any>(url);
  }

  removeDoneTask(task: any): Observable<any> {
    const url = `${this.apiUrl}/remove-done/${task.id}`;
    return this.http.delete<any>(url);
  }

  // New method to move a task from 'to_do' to 'doing'
  moveTaskFromToDoToDoing(task: any): Observable<any> {
    const url = `${this.apiUrl}/move-from-to-do-to-doing/${task.id}`;
    return this.http.put<any>(url, {});
  }
}
