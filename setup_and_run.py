import os
import subprocess
import sys
import time

def run_command(command, cwd=None):
    print(f"[*] Running: {command}")
    try:
        subprocess.check_call(command, shell=True, cwd=cwd)
    except subprocess.CalledProcessError as e:
        print(f"[!] Error executing: {command}")
        print(f"[!] Details: {e}")
        sys.exit(1)

def main():
    # Get the directory where the script is located
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("==========================================================")
    print("   Financial Advisor AI - Setup and Execution Script")
    print("==========================================================")
    
    # Step 1: Check for .env file
    env_file = os.path.join(base_dir, ".env")
    if not os.path.exists(env_file):
        print("\n[!] WARNING: .env file not found in the root directory.")
        print("    Please ensure you create a .env file with the following variables:")
        print("    - OPENAI_API_KEY")
        print("    - SMTP_EMAIL")
        print("    - SMTP_PASSWORD")
        print("    - DATABASE_URL")
        print("    The application may fail to start correctly without these.\n")
        time.sleep(2)
    else:
        print("\n[+] .env file detected.")

    # Step 2: Install Node Dependencies
    print("\n--- Step 1: Installing Node dependencies (pnpm install) ---")
    run_command("pnpm install", cwd=base_dir)
    
    # Step 3: Install Python Dependencies
    backend_dir = os.path.join(base_dir, "backend")
    if os.path.exists(backend_dir):
        print("\n--- Step 2: Installing Python dependencies for backend ---")
        run_command("pip install -r requirements.txt", cwd=backend_dir)
    else:
        print("\n[-] Backend directory not found. Skipping Python dependencies installation.")

    # Step 4: Run the Application
    print("\n--- Step 3: Starting the application ---")
    print("[*] Launching frontend and backend servers...")
    print("[*] Press Ctrl+C to stop the application.\n")
    try:
        # Use subprocess.call instead of check_call so we can handle KeyboardInterrupt cleanly
        subprocess.call("pnpm start", shell=True, cwd=base_dir)
    except KeyboardInterrupt:
        print("\n[+] Application stopped by user.")
    except Exception as e:
        print(f"\n[!] An error occurred while running the application: {e}")

if __name__ == "__main__":
    main()
