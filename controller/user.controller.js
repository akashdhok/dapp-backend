import User from '../models/user.model.js';
import Task from '../models/task.model.js';
import Package from '../models/package.model.js';
import Submission from '../models/submission.model.js';

// Get User Dashboard Data
export const getUserDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const referralCount = await User.countDocuments({ referredBy: user._id });
    const activeReferralCount = await User.countDocuments({ referredBy: user._id, status: 'active' });

    const totalSubmissions = await Submission.countDocuments({ userId: user._id });
    const pendingSubmissions = await Submission.countDocuments({ userId: user._id, status: 'pending' });
    const approvedSubmissions = await Submission.countDocuments({ userId: user._id, status: 'approved' });

    const recentSubmissions = await Submission.find({ userId: user._id })
      .populate('taskId', 'title imageUrl reward')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          referralCode: user.referralCode,
          canRefer: user.status === 'active',
          purchasedPackage: user.purchasedPackage,
        },
        stats: {
          status: user.status,
          isPackageActive: Boolean(user.purchasedPackage && user.purchasedPackage.packageId),
          totalReferrals: referralCount,
          activeReferrals: activeReferralCount,
          totalSubmissions,
          pendingSubmissions,
          approvedSubmissions,
        },
        recentSubmissions,
      },
    });
  } catch (error) {
    console.error('getUserDashboard error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Get Available Packages for User to browse
export const getAvailablePackages = async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true }).sort({ price: 1 });
    return res.json({
      success: true,
      packages,
    });
  } catch (error) {
    console.error('getAvailablePackages error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Purchase Package -> Immediately Activates User!
export const purchasePackage = async (req, res) => {
  try {
    const { packageId } = req.params;
    const pkg = await Package.findById(packageId);

    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Set purchased package and activate user
    user.purchasedPackage = {
      packageId: pkg._id,
      name: pkg.name,
      price: pkg.price,
      purchasedAt: new Date(),
    };
    user.status = 'active'; // Key requirement: package purchase turns user status to active
    await user.save();

    return res.json({
      success: true,
      message: `Congratulations! Package "${pkg.name}" activated successfully. Your account is now ACTIVE and your referral link is unlocked!`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        canRefer: true,
        referralCode: user.referralCode,
        purchasedPackage: user.purchasedPackage,
      },
    });
  } catch (error) {
    console.error('purchasePackage error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Get Available Tasks with User's submission status attached
export const getAvailableTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ isActive: true }).sort({ createdAt: -1 });

    // Fetch user's submissions for all tasks
    const userSubmissions = await Submission.find({ userId: req.user._id });
    const submissionMap = {};
    userSubmissions.forEach((sub) => {
      submissionMap[sub.taskId.toString()] = sub;
    });

    const tasksWithStatus = tasks.map((t) => {
      const sub = submissionMap[t._id.toString()];
      return {
        ...t.toObject(),
        mySubmission: sub
          ? {
              id: sub._id,
              status: sub.status,
              screenshotUrl: sub.screenshotUrl,
              adminRemark: sub.adminRemark,
              createdAt: sub.createdAt,
            }
          : null,
      };
    });

    return res.json({
      success: true,
      tasks: tasksWithStatus,
    });
  } catch (error) {
    console.error('getAvailableTasks error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// User Submits Task with Screenshot Proof
export const submitTaskProof = async (req, res) => {
  try {
    const { taskId } = req.params;
    let { notes, screenshotUrl } = req.body;

    if (req.file) {
      screenshotUrl = `/uploads/${req.file.filename}`;
    }

    if (!screenshotUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a screenshot (SS) as proof of task completion',
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check if user already submitted this task
    let submission = await Submission.findOne({
      taskId,
      userId: req.user._id,
    });

    if (submission) {
      if (submission.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Task is already approved and completed!',
        });
      }
      // Re-submission if rejected or updating pending submission
      submission.screenshotUrl = screenshotUrl;
      submission.notes = notes || '';
      submission.status = 'pending';
      submission.adminRemark = '';
      submission.reviewedAt = null;
      await submission.save();
    } else {
      submission = await Submission.create({
        taskId,
        userId: req.user._id,
        screenshotUrl,
        notes: notes || '',
        status: 'pending',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Screenshot submitted successfully. Awaiting admin verification!',
      submission,
    });
  } catch (error) {
    console.error('submitTaskProof error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Get User's Task Submissions history
export const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.user._id })
      .populate('taskId', 'title description imageUrl reward')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error('getMySubmissions error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Get User's Referrals (Protected: Only active users can refer)
export const getReferrals = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.status !== 'active') {
      return res.json({
        success: true,
        canRefer: false,
        message: 'Your account is inactive. Please purchase a package to activate your account and unlock your referral link.',
        referralCode: null,
        referrals: [],
      });
    }

    // Fetch all users who registered with this user's referralCode
    const referrals = await User.find({ referredBy: user._id })
      .select('name email status purchasedPackage createdAt')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      canRefer: true,
      referralCode: user.referralCode,
      referrals,
      stats: {
        total: referrals.length,
        active: referrals.filter((r) => r.status === 'active').length,
        inactive: referrals.filter((r) => r.status === 'inactive').length,
      },
    });
  } catch (error) {
    console.error('getReferrals error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

