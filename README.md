# **Project Contribution Guide**  

Welcome to the project! This guide will walk you through **forking the repository, setting up your development environment, and contributing to new features** while following our structured workflow.  

---

## **📌 Getting Started**  

### **1️⃣ Fork the Repository**  
1. Navigate to the project’s GitHub repository.  
2. Click **Fork** (top right) to create your own copy of the repository.  
3. Clone your fork to your local machine:  

   ```sh
   git clone https://github.com/YOUR_USERNAME/YOUR_FORK.git
   cd YOUR_FORK
   ```

4. Add the original repository as an upstream remote to keep your fork updated:  

   ```sh
   git remote add upstream https://github.com/ORIGINAL_OWNER/PROJECT_NAME.git
   ```

5. Fetch the latest changes:  

   ```sh
   git pull upstream main
   ```

---

## **🔧 Setting Up Your Development Environment**  

### **2️⃣ Install Dependencies**  
We use **pnpm** to manage dependencies. Install them by running:  

```sh
pnpm install
```

Ensure you are using **Node.js (LTS version)** and **pnpm** installed globally:

```sh
corepack enable
corepack prepare pnpm@latest --activate
```

### **3️⃣ Install Docker (Optional but Recommended)**  
For local development, we recommend running dependencies (like MongoDB, Redis) via **Docker**.  

1. Install **Docker Desktop**: [Docker Installation Guide](https://docs.docker.com/get-docker/)  
2. Start the necessary services:

   ```sh
   docker compose up -d
   ```

---

## **🛠 Working on Features**  

### **4️⃣ Using `prompt_plan.md` & `todo.md`**  
Before starting a feature, check `prompt_plan.md` for structured guidance on how the feature should be built. Use `todo.md` to track development progress.  

**🚀 Recommended Workflow:**  
1. **Review `prompt_plan.md`** – This document contains an outline for the feature.  
2. **Run code generation (if applicable)** – Use LLM tools to scaffold boilerplate code.  
3. **Update `todo.md`** – Break down tasks into smaller steps and check them off as you progress.  

---

## **🔄 Keeping Your Fork Updated**  
Sync your fork with the latest upstream changes regularly:  

```sh
git pull upstream main
git push origin main
```

---

## **🚀 Submitting Your Work**  

1. **Create a feature branch**:  
   ```sh
   git checkout -b feature/my-new-feature
   ```

2. **Commit your changes**:  
   ```sh
   git commit -m "Added feature: XYZ"
   ```

3. **Push to your fork**:  
   ```sh
   git push origin feature/my-new-feature
   ```

4. **Create a Pull Request (PR)**:  
   - Go to your fork on GitHub  
   - Click **Compare & pull request**  
   - Add a description and request a review  

---

## **💡 Contribution Guidelines**  
- Follow the **TypeScript coding standards** (strict types, error handling, relative imports).  
- Use **barrel imports** to keep code clean.  
- Keep PRs **small and focused**—one feature or fix per PR.  
- Ensure all tests pass before submitting a PR.  

---

## **🎯 Need Help?**  
If you run into issues:  
- Check existing discussions and issues on GitHub.  
- Join the project's Slack/Discord for quick help.  
- Create a new GitHub issue if your problem isn't covered.  

---

**Happy coding! 🚀**