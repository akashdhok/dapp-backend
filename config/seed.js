import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import Package from '../models/package.model.js';
import Task from '../models/task.model.js';

export const seedInitialData = async () => {
  try {
    // 1. Check & Seed Admin User
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      await User.create({
        name: 'NEXORA Administrator',
        email: 'admin@example.com',
        userId: 'ADMIN01',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        referralCode: 'ADMIN01',
      });
      console.log('👑 Admin user seeded: admin@example.com / admin123');
    }

    // 2. Check & Seed the User provided by the prompt: OL667275 / 123456
    const existingNEXORAUser = await User.findOne({
      $or: [{ userId: 'OL667275' }, { email: 'gaurangp69@gmail.com' }],
    });
    if (!existingNEXORAUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);

      await User.create({
        name: 'Gaurang Patel',
        email: 'gaurangp69@gmail.com',
        userId: 'OL667275',
        password: hashedPassword,
        role: 'user',
        status: 'inactive', // Starts inactive, will activate on package purchase
        referralCode: 'OL667275',
      });
      console.log('👤 NEXORA User seeded: OL667275 / 123456 (Status: Inactive)');
    }

    // Also seed user@example.com for generic demo
    const existingDemoUser = await User.findOne({ email: 'user@example.com' });
    if (!existingDemoUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('user123', salt);

      await User.create({
        name: 'Demo Member',
        email: 'user@example.com',
        userId: 'NX100001',
        password: hashedPassword,
        role: 'user',
        status: 'inactive',
        referralCode: 'NX100',
      });
    }

    // 3. Clear and Re-seed the 7 SRS Subscription Plans for NEXORA
    const count = await Package.countDocuments();
    if (count <= 3) {
      await Package.deleteMany({});
      await Package.insertMany([
        {
          name: 'Plan 1 — Foundation Tier',
          price: 100,
          badge: 'Daily 2.0%',
          description: '$100–$1,000 subscription with 2.0% daily earnings, instant account activation, and level 1 social education access.',
          features: [
            '2.0% Daily Income Rate',
            'Level 1: Social Media Fundamentals Course',
            'Instant Account Activation',
            'Unlocks 6-Level Referral Network',
            '3X Milestone Earning Guarantee',
          ],
          isActive: true,
        },
        {
          name: 'Plan 2 — Creator Tier',
          price: 1000,
          badge: 'Daily 2.5%',
          description: '$1,000–$2,000 subscription with 2.5% daily earnings, content creation tools, and priority task payouts.',
          features: [
            '2.5% Daily Income Rate',
            'Level 2: Content Creation & Video Academy',
            'Access to AI Content & Marketing Assistants',
            'Fast-Track Screenshot Approvals',
            'Enhanced Referral Commission Multipliers',
          ],
          isActive: true,
        },
        {
          name: 'Plan 3 — Growth Tier',
          price: 2000,
          badge: 'Daily 3.0%',
          description: '$2,000–$3,000 subscription with 3.0% daily earnings, audience growth automation, and weekly live webinars.',
          features: [
            '3.0% Daily Income Rate',
            'Level 3: Audience Growth & Traffic Strategies',
            '50+ AI Tools Access (Writing, Images, Video)',
            'Silver Achievement Badge Eligibility ($1,000+ topup)',
            'Priority USDT Withdrawal Processing',
          ],
          isActive: true,
        },
        {
          name: 'Plan 4 — Influencer Tier',
          price: 3000,
          badge: 'Daily 3.5%',
          description: '$3,000–$4,000 subscription with 3.5% daily earnings, influencer collaboration networks, and high-payout tasks.',
          features: [
            '3.5% Daily Income Rate',
            'Level 4: Influencer Marketing & Brand Deals',
            'Gold Achievement Badge Eligibility (2% Daily CTO)',
            'High-Yield Social Media Tasks',
            'Dedicated Account Manager Support',
          ],
          isActive: true,
        },
        {
          name: 'Plan 5 — Business Tier',
          price: 4000,
          badge: 'Daily 4.0%',
          description: '$4,000–$5,000 subscription with 4.0% daily return, e-commerce dropshipping modules, and store automation.',
          features: [
            '4.0% Daily Income Rate',
            'Level 5: Global E-Commerce Business Suite',
            'Online Store Setup & Product Research AI',
            'Team Commission Acceleration on 6 Levels',
            'Instant Withdrawal Approvals',
          ],
          isActive: true,
        },
        {
          name: 'Plan 6 — Executive Tier',
          price: 5000,
          badge: 'Daily 5.0%',
          description: '$5,000–$10,000 subscription with 5.0% daily return, advanced business leadership, and diamond achievement ranking.',
          features: [
            '5.0% Daily Income Rate',
            'Level 6: Advanced Digital Business Management',
            'Diamond Achievement (3% Daily CTO Rate)',
            'Exclusive High-Payout Partner Tasks',
            'VIP Global Mastermind Access',
          ],
          isActive: true,
        },
        {
          name: 'Plan 7 — Elite Crown Tier',
          price: 10000,
          badge: 'Daily 10.0%',
          description: '$10,000+ subscription with maximum 10.0% daily return, Red Diamond status, and full institutional support.',
          features: [
            '10.0% Daily Return Rate (Max ROI)',
            'Red Diamond Achievement (4% Daily CTO Rate)',
            'Unlimited Access to All 50+ AI Tools & Courses',
            'Maximum 6-Level Referral Commission Payouts',
            '1-on-1 Executive Growth Advisory',
          ],
          isActive: true,
        },
      ]);
      console.log('📦 SRS 7 Subscription Plans seeded successfully.');
    }

    // 4. Tasks from the SRS
    const taskCount = await Task.countDocuments();
    if (taskCount === 0) {
      await Task.insertMany([
        {
          title: 'Join & Engage in NEXORA Telegram Community',
          description: 'Join the NEXORA global community on Telegram, post an introduction message, and upload a screenshot showing your active member profile.',
          imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60',
          reward: 25,
          isActive: true,
        },
        {
          title: 'Subscribe to NEXORA YouTube Channel & Like Announcement',
          description: 'Subscribe to our official NEXORA YouTube education channel, watch the AI tools launch video, leave a comment, and upload a screenshot proof.',
          imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=60',
          reward: 35,
          isActive: true,
        },
        {
          title: 'Publish Social Media Reel with #NEXORA',
          description: 'Post a 15-30 second video reel on Instagram or TikTok discussing social media earning and AI tools. Upload screenshot showing views and #NEXORA hashtags.',
          imageUrl: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=800&auto=format&fit=crop&q=60',
          reward: 50,
          isActive: true,
        },
        {
          title: 'Share Promotional Banner on WhatsApp Status',
          description: 'Put our platform poster and your referral link on your WhatsApp status for 24 hours. Take screenshot after 2 hours showing views.',
          imageUrl: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=800&auto=format&fit=crop&q=60',
          reward: 20,
          isActive: true,
        },
      ]);
      console.log('📝 Social Media Tasks seeded successfully.');
    }
  } catch (error) {
    console.error('Error during data seeding:', error);
  }
};
