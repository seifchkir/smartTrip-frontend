import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
  standalone: false
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  messages: ChatMessage[] = [];
  newMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private dialogRef: MatDialogRef<ChatbotComponent>
  ) {}

  ngOnInit() {
    // Add welcome message
    this.messages.push({
      content: 'Hello! I\'m your travel assistant. How can I help you today?',
      isUser: false,
      timestamp: new Date()
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    // Add user message to chat
    this.messages.push({
      content: this.newMessage,
      isUser: true,
      timestamp: new Date()
    });

    const userMessage = this.newMessage;
    this.newMessage = '';
    this.isLoading = true;

    // Get current user ID from auth service
    const userId = this.authService.getCurrentUser()?.id || '123';

    // Send message to backend
   this.http.post('http://localhost:8000/api/chat', {
    content: userMessage,
    user_id: userId
  }, {
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId
    }
    }).subscribe({
      next: (response: any) => {
        // Add bot response to chat
        this.messages.push({
          content: response.response || 'I apologize, but I couldn\'t process your request.',
          isUser: false,
          timestamp: new Date()
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.messages.push({
          content: 'Sorry, I encountered an error. Please try again later.',
          isUser: false,
          timestamp: new Date()
        });
        this.isLoading = false;
      }
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
