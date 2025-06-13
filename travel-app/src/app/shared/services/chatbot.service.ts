import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ChatbotComponent } from '../components/chatbot/chatbot.component';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  constructor(private dialog: MatDialog) {}

  openChatbot() {
    this.dialog.open(ChatbotComponent, {
      width: '500px',
      height: '650px',
      panelClass: 'chatbot-dialog'
    });
  }
}
