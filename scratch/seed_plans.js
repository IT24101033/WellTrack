'use strict';

const mongoose = require('mongoose');
const LifestyleTip = require('./backend/src/models/lifestyleTipModel');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

const seedPlans = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/welltrack');
        console.log('Connected to MongoDB');

        const plans = [
            // DIET PLANS
            {
                title: "Intermittent Fasting (16:8)",
                description: "Eat all your meals within an 8-hour window and fast for the remaining 16 hours. This helps with weight loss and improving metabolic health. Best window: 12 PM to 8 PM.",
                category: "DIET",
                difficulty_level: "MEDIUM",
                target_type: "GENERAL",
                recommended_time: "12:00 PM",
                image_url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=500&auto=format&fit=crop"
            },
            {
                title: "Mediterranean Heart-Healthy Plan",
                description: "Focus on plant-based foods, healthy fats like olive oil, and lean proteins like fish. Limit red meat and processed sugars to improve heart health.",
                category: "DIET",
                difficulty_level: "EASY",
                target_type: "GENERAL",
                recommended_time: "07:00 AM",
                image_url: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=500&auto=format&fit=crop"
            },
            {
                title: "High-Protein Muscle Gain",
                description: "Focus on lean meats, eggs, and legumes. Aim for 1.6g of protein per kg of body weight to support muscle repair and growth after workouts.",
                category: "DIET",
                difficulty_level: "MEDIUM",
                target_type: "FITNESS",
                recommended_time: "01:00 PM",
                image_url: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=500&auto=format&fit=crop"
            },

            // WORKOUT PLANS
            {
                title: "7-Minute Full Body HIIT",
                description: "12 high-intensity exercises (Jumping Jacks, Wall Sit, Push-ups, Abdominal Crunches, Step-up, Squats, Triceps Dips, Plank, High Knees, Lunges, Push-up & Rotation, Side Plank) for 30 seconds each.",
                category: "WORKOUT",
                difficulty_level: "HARD",
                target_type: "FITNESS",
                recommended_time: "06:30 AM",
                image_url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=500&auto=format&fit=crop"
            },
            {
                title: "Yoga for Stress Relief",
                description: "A gentle series of Child’s Pose, Cat-Cow, Downward Dog, and Pigeon Pose to release tension and improve flexibility. Perfect for winding down.",
                category: "WORKOUT",
                difficulty_level: "EASY",
                target_type: "STRESS",
                recommended_time: "09:00 PM",
                image_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=500&auto=format&fit=crop"
            },
            {
                title: "Strength Building (Push Day)",
                description: "Focus on chest, shoulders, and triceps. Exercises: Bench Press, Overhead Press, and Tricep Extensions (3 sets of 8-12 reps).",
                category: "WORKOUT",
                difficulty_level: "MEDIUM",
                target_type: "FITNESS",
                recommended_time: "05:00 PM",
                image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=500&auto=format&fit=crop"
            },

            // MENTAL WELLNESS PLANS
            {
                title: "Daily Mindfulness Meditation",
                description: "Sit in a quiet space, close your eyes, and focus on your breath for 10 minutes. When your mind wanders, gently bring it back to your breathing.",
                category: "MENTAL",
                difficulty_level: "EASY",
                target_type: "STRESS",
                recommended_time: "08:00 AM",
                image_url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=500&auto=format&fit=crop"
            },
            {
                title: "Deep Sleep Protocol",
                description: "Turn off screens 1 hour before bed. Practice 4-7-8 breathing technique (Inhale for 4s, Hold for 7s, Exhale for 8s) to calm the nervous system.",
                category: "MENTAL",
                difficulty_level: "EASY",
                target_type: "SLEEP",
                recommended_time: "10:30 PM",
                image_url: "https://images.unsplash.com/photo-1511295742364-917533ab3ca5?q=80&w=500&auto=format&fit=crop"
            },
            {
                title: "Gratitude Journaling",
                description: "Write down 3 things you are grateful for today. This shifts focus from stress to positive aspects of life and improves long-term happiness.",
                category: "MENTAL",
                difficulty_level: "EASY",
                target_type: "GENERAL",
                recommended_time: "08:30 PM",
                image_url: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=500&auto=format&fit=crop"
            }
        ];

        for (const plan of plans) {
            const exists = await LifestyleTip.findOne({ title: plan.title });
            if (!exists) {
                await LifestyleTip.create(plan);
                console.log(`Created plan: ${plan.title}`);
            }
        }

        console.log('Seeding complete.');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seedPlans();
