// After successful registration
  onSubmit() {
    // ... existing code ...

    this.authService.register(userData).subscribe({
      next: (response) => {
        // ... existing code ...

        // Store the email separately for easier access
        localStorage.setItem('userEmail', userData.email);

        // ... existing code ...
      }
    });
  }
