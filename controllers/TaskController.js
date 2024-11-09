const Task = require("../models/Task");

class TaskController {
  static async getAllTasks(req, res) {
    try {
      const tasks = await Task.find().sort({ dateTime: 1 });
      return res.status(200).json({
        message: "Tasks retrieved successfully",
        tasks,
      });
    } catch (error) {
      console.error("Error in getAllTasks:", error);
      res.status(500).json({
        message: "Error retrieving tasks",
        error: error.message,
      });
    }
  }
  // Create Task
  static async createTask(req, res) {
    try {
      const { title, description, dateTime, priority } = req.body;

      if (!title || !dateTime?.startTime || !dateTime?.endTime) {
        return res.status(400).json({
          message: "Title, start time and end time are mandatory fields",
        });
      }

      const newTask = new Task({
        title,
        description,
        dateTime: {
          startTime: dateTime.startTime,
          endTime: dateTime.endTime,
        },
        priority: priority,
        status: "In Progress",
      });

      await newTask.save();
      res.status(201).json({
        message: "Task created successfully",
        task: newTask,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error creating task", error });
    }
  }

  // Edit Task
  static async editTask(req, res) {
    try {
      const { id } = req.params;
      const { title, description, dateTime, priority } = req.body;

      // Validate required fields
      if (title === "" || dateTime === "") {
        return res.status(400).json({
          message: "Title and dateTime cannot be empty",
        });
      }

      const updatedTask = await Task.findByIdAndUpdate(
        id,
        {
          title,
          description,
          dateTime: dateTime ? new Date(dateTime) : undefined,
          priority,
        },
        { new: true, runValidators: true }
      );

      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.status(200).json({
        message: "Task updated successfully",
        task: updatedTask,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error updating task", error });
    }
  }

  // Delete Task
  static async deleteTask(req, res) {
    try {
      const { id } = req.params;
      const deletedTask = await Task.findByIdAndDelete(id);

      if (!deletedTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.status(200).json({
        message: "Task deleted successfully",
        taskId: id,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting task", error });
    }
  }

  // Search Tasks
  static async searchTasks(req, res) {
    try {
      const { keyword } = req.query;
      console.log(keyword, "keyword");

      if (!keyword) {
        return res.status(400).json({
          message: "Search keyword is required",
        });
      }

      const tasks = await Task.find({
        $or: [
          { title: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
        ],
      }).sort({ dateTime: 1 }); // Sort by date

      res.status(200).json({
        message: "Search results retrieved successfully",
        count: tasks.length,
        tasks,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error searching tasks", error });
    }
  }

  // Update Task Status to 'In Progress' or 'Completed'
  static async updateTaskStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate status
      if (!["In Progress", "Completed"].includes(status)) {
        return res.status(400).json({
          message: "Invalid status. Must be 'In Progress' or 'Completed'",
        });
      }

      const updatedTask = await Task.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      const openTasks = weeklyTasks.filter(
        (task) => task.status !== "Completed"
      ).length;
      const completedTasks = weeklyTasks.filter(
        (task) => task.status === "Completed"
      ).length;

      res.status(200).json({
        message: "Task status updated successfully",
        task: updatedTask,
        weeklySummary: {
          week: `${weekStart.toDateString()} - ${weekEnd.toDateString()}`,
          openTasks,
          completedTasks,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error updating task status", error });
    }
  }
  static async updateTaskPriority(req, res) {
    try {
      const { id } = req.params;
      const { priority } = req.body;

      // Validate priority
      if (!["Low", "Medium", "High"].includes(priority)) {
        return res.status(400).json({
          message: "Invalid priority. Must be 'Low', 'Medium' or 'High'",
        });
      }

      const updatedTask = await Task.findByIdAndUpdate(
        id,
        { priority },
        { new: true }
      );

      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.status(200).json({
        message: "Task priority updated successfully",
        task: updatedTask,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error updating task priority", error });
    }
  }

  // Get Weekly Task Summary
  // Get Weekly Task Summary
  static async getWeeklySummary(req, res) {
    try {
      const pipeline = [
        {
          $addFields: {
            weekStart: {
              $toDate: {
                $concat: [
                  {
                    $toString: {
                      $substrCP: ["$dateTime.startTime", 0, 2],
                    },
                  },
                  "/",
                  {
                    $toString: {
                      $substrCP: ["$dateTime.startTime", 3, 2],
                    },
                  },
                  "/",
                  {
                    $toString: {
                      $year: new Date(),
                    },
                  },
                ],
              },
            },
            week: {
              $dateTrunc: {
                date: "$weekStart",
                unit: "week",
                startOfWeek: "Monday",
              },
            },
          },
        },
        {
          $group: {
            _id: "$week",
            openTasks: {
              $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] },
            },
            completedTasks: {
              $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
            },
            tasks: {
              $push: {
                _id: "$_id",
                title: "$title",
                description: "$description",
                dateTime: {
                  startTime: "$dateTime.startTime",
                  endTime: "$dateTime.endTime",
                },
                priority: "$priority",
                status: "$status",
              },
            },
          },
        },
        {
          $sort: { _id: 1 }, // Sort by week
        },
        {
          $project: {
            week: "$_id",
            openTasks: 1,
            completedTasks: 1,
            totalTasks: { $size: "$tasks" },
            tasks: 1,
            _id: 0,
          },
        },
      ];

      const weeklySummary = await Task.aggregate(pipeline);

      res.status(200).json({
        message: "Weekly summary retrieved successfully",
        weeklySummary,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching weekly summary", error });
    }
  }
}

module.exports = TaskController;
