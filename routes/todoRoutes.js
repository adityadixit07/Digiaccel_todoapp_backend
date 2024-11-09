const express = require("express");
const TaskController = require("../controllers/TaskController");
const e = require("express");
const todoRoutes = express.Router();

todoRoutes.get("/all", TaskController.getAllTasks);
todoRoutes.post("/create", TaskController.createTask);
todoRoutes.put("/edit/:id", TaskController.editTask);
todoRoutes.delete("/delete/:id", TaskController.deleteTask);
todoRoutes.get("/search", TaskController.searchTasks);
todoRoutes.put("/status/:id", TaskController.updateTaskStatus);
todoRoutes.put("/task/priority/:id", TaskController.updateTaskPriority);
todoRoutes.get("/weekly-summary", TaskController.getWeeklySummary);

module.exports = todoRoutes;
