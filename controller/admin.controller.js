import User from '../models/user.model.js';
import Task from '../models/task.model.js';
import Package from '../models/package.model.js';
import Submission from '../models/submission.model.js';

// Get Admin Dashboard Overview Statistics
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({ role: 'user', status: 'active' });
    const inactiveUsers = await User.countDocuments({ role: 'user', status: 'inactive' });

    const totalPackages = await Package.countDocuments();
    const totalTasks = await Task.countDocuments();

    const totalSubmissions = await Submission.countDocuments();
    const pendingSubmissions = await Submission.countDocuments({ status: 'pending' });
    const approvedSubmissions = await Submission.countDocuments({ status: 'approved' });
    const rejectedSubmissions = await Submission.countDocuments({ status: 'rejected' });

    const recentUsers = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentSubmissions = await Submission.find()
      .populate('userId', 'name email')
      .populate('taskId', 'title reward')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalPackages,
        totalTasks,
        totalSubmissions,
        pendingSubmissions,
        approvedSubmissions,
        rejectedSubmissions,
      },
      recentUsers,
      recentSubmissions,
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// User Management: Get users filtered by status (all, active, inactive)
export const getUsers = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = { role: 'user' };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { referralCode: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('referredBy', 'name email referralCode')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// User Management: Update user status (active / inactive)
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value. Must be active or inactive.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = status;
    await user.save();

    return res.json({
      success: true,
      message: `User status updated to ${status}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    console.error('updateUserStatus error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Task Management: Create new task
export const createTask = async (req, res) => {
  try {
    let { title, description, imageUrl, reward } = req.body;

    // If file was uploaded via multer
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    if (!title || !description || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and task image are required',
      });
    }

    const task = await Task.create({
      title,
      description,
      imageUrl,
      reward: reward ? Number(reward) : 50,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    console.error('createTask error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Task Management: List all tasks for admin
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error('getTasks error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Task Management: Update task
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const task = await Task.findByIdAndUpdate(id, updateData, { new: true });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    return res.json({
      success: true,
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    console.error('updateTask error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Task Management: Delete task
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Also delete any submissions related to this task
    await Submission.deleteMany({ taskId: id });

    return res.json({
      success: true,
      message: 'Task and related submissions deleted successfully',
    });
  } catch (error) {
    console.error('deleteTask error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Task Submissions: Get all user task submissions
export const getSubmissions = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const submissions = await Submission.find(filter)
      .populate('userId', 'name email status referralCode')
      .populate('taskId', 'title description imageUrl reward')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error('getSubmissions error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Task Submissions: Admin approve or reject submission
export const updateSubmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemark } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved, rejected, or pending' });
    }

    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    submission.status = status;
    if (adminRemark !== undefined) {
      submission.adminRemark = adminRemark;
    }
    submission.reviewedAt = new Date();
    await submission.save();

    const populatedSubmission = await Submission.findById(id)
      .populate('userId', 'name email')
      .populate('taskId', 'title reward');

    return res.json({
      success: true,
      message: `Task submission ${status} successfully`,
      submission: populatedSubmission,
    });
  } catch (error) {
    console.error('updateSubmissionStatus error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Package Management: Create package
export const createPackage = async (req, res) => {
  try {
    const { name, price, description, features, badge } = req.body;

    if (!name || price === undefined || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and description are required',
      });
    }

    const parsedFeatures = Array.isArray(features)
      ? features
      : typeof features === 'string'
      ? features.split(',').map((f) => f.trim()).filter(Boolean)
      : [];

    const pkg = await Package.create({
      name,
      price: Number(price),
      description,
      features: parsedFeatures,
      badge: badge || 'Popular',
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Package created successfully',
      package: pkg,
    });
  } catch (error) {
    console.error('createPackage error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Package Management: Get all packages for admin
export const getPackages = async (req, res) => {
  try {
    const packages = await Package.find().sort({ price: 1 });
    return res.json({
      success: true,
      packages,
    });
  } catch (error) {
    console.error('getPackages error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Package Management: Delete package (Admin option)
export const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const pkg = await Package.findByIdAndDelete(id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    return res.json({
      success: true,
      message: 'Package deleted successfully',
    });
  } catch (error) {
    console.error('deletePackage error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

