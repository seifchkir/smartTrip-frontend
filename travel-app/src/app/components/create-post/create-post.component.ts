import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SocialService } from '../../services/social.service';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="create-post-container">
      <form [formGroup]="postForm" (ngSubmit)="onSubmit()" class="post-form">
        <div class="form-group">
          <input
            type="text"
            formControlName="title"
            placeholder="Title (optional)"
            class="form-control"
          >
        </div>

        <div class="form-group">
          <textarea
            formControlName="text"
            placeholder="What's on your mind?"
            class="form-control"
            rows="4"
          ></textarea>
        </div>

        <div class="form-group">
          <input
            type="text"
            formControlName="tags"
            placeholder="Tags (comma-separated)"
            class="form-control"
          >
        </div>

        <div class="form-group image-upload-group">
          <button type="button" class="choose-image-btn" (click)="triggerFileInput()">
            <i class="fas fa-image"></i> Choose Image
          </button>
          <input
            type="file"
            (change)="onFileSelected($event)"
            accept="image/*"
            class="file-input"
            #fileInput
          >
          <div class="image-preview" *ngIf="previewUrl">
            <img [src]="previewUrl" alt="Preview">
            <button type="button" class="remove-image" (click)="removeImage()" title="Remove image">×</button>
          </div>
        </div>

        <div class="error-message" *ngIf="errorMessage">
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          class="submit-button"
          [disabled]="!postForm.valid || isLoading"
        >
          {{ isLoading ? 'Posting...' : 'Create Post' }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .create-post-container {
      background: white;
      border-radius: 16px;
      padding: 28px 24px 20px 24px;
      box-shadow: 0 4px 16px rgba(77, 171, 247, 0.08);
      display: flex;
      flex-direction: column;
      align-items: stretch;
      margin-bottom: 10px;
    }
    .post-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-control {
      padding: 12px 14px;
      border: 1.5px solid #e3eaf2;
      border-radius: 8px;
      font-size: 15px;
      background: #f8fafc;
      transition: border 0.2s;
    }
    .form-control:focus {
      border-color: #4dabf7;
      outline: none;
      background: #fff;
    }
    textarea.form-control {
      resize: vertical;
      min-height: 90px;
    }
    .image-upload-group {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .choose-image-btn {
      background: #f1f7ff;
      color: #4dabf7;
      border: 1.5px solid #4dabf7;
      border-radius: 8px;
      padding: 8px 18px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s, color 0.2s;
    }
    .choose-image-btn:hover {
      background: #4dabf7;
      color: #fff;
    }
    .file-input {
      display: none;
    }
    .image-preview {
      position: relative;
      max-width: 120px;
      margin-top: 8px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(77, 171, 247, 0.10);
      overflow: hidden;
      background: #f8fafc;
      border: 1.5px solid #e3eaf2;
    }
    .image-preview img {
      width: 100%;
      display: block;
      border-radius: 8px;
    }
    .remove-image {
      position: absolute;
      top: 4px;
      right: 4px;
      background: #ff6b6b;
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      transition: background 0.2s;
    }
    .remove-image:hover {
      background: #e63946;
    }
    .submit-button {
      background: #4dabf7;
      color: white;
      border: none;
      padding: 14px;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.3s;
      margin-top: 8px;
    }
    .submit-button:disabled {
      background: #bcdffb;
      cursor: not-allowed;
    }
    .submit-button:hover:not(:disabled) {
      background: #3b8ce2;
    }
    .error-message {
      color: #ff4444;
      font-size: 15px;
      margin-top: 5px;
      text-align: center;
    }
  `]
})
export class CreatePostComponent {
  postForm: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isLoading = false;
  errorMessage = '';
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private formBuilder: FormBuilder,
    private socialService: SocialService
  ) {
    this.postForm = this.formBuilder.group({
      title: [''],
      text: ['', [Validators.required, Validators.minLength(1)]],
      tags: ['']
    });
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.previewUrl = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onSubmit() {
    if (this.postForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formData = new FormData();
      formData.append('text', this.postForm.get('text')?.value);

      if (this.postForm.get('title')?.value) {
        formData.append('title', this.postForm.get('title')?.value);
      }

      if (this.postForm.get('tags')?.value) {
        formData.append('tags', this.postForm.get('tags')?.value);
      }

      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      }

      this.socialService.createPost(formData).subscribe({
        next: (response) => {
          this.postForm.reset();
          this.selectedFile = null;
          this.previewUrl = null;
          if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to create post. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }
}
