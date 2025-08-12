// setup-database.js
const { Client, Databases, ID } = require('appwrite');

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1') // یا endpoint خودتان
    .setProject('YOUR_PROJECT_ID') // پروژه ID خود را جایگزین کنید
    .setKey('YOUR_API_KEY'); // API Key خود را جایگزین کنید

const databases = new Databases(client);
const DATABASE_ID = 'life_management';

async function setupDatabase() {
    try {
        console.log('🔄 در حال ایجاد دیتابیس...');
        
        // ایجاد دیتابیس
        await databases.create(DATABASE_ID, 'Life Management Database');
        console.log('✅ دیتابیس ایجاد شد');

        // کالکشن Users
        await createUsersCollection();
        
        // کالکشن Tasks  
        await createTasksCollection();
        
        // کالکشن Habits
        await createHabitsCollection();
        
        // کالکشن Calendar Events
        await createEventsCollection();
        
        // کالکشن Habit Check-ins
        await createCheckinsCollection();
        
        // کالکشن Rewards
        await createRewardsCollection();
        
        console.log('🎉 تمام کالکشن‌ها با موفقیت ایجاد شدند!');
        
    } catch (error) {
        console.error('❌ خطا در ایجاد دیتابیس:', error);
    }
}

async function createUsersCollection() {
    const collectionId = 'users';
    
    // ایجاد کالکشن
    await databases.createCollection(DATABASE_ID, collectionId, 'Users');
    
    // ایجاد attributes
    await databases.createIntegerAttribute(DATABASE_ID, collectionId, 'telegram_id', true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'first_name', 100, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'last_name', 100, false);
    await databases.createIntegerAttribute(DATABASE_ID, collectionId, 'xp_points', false, undefined, undefined, 0);
    await databases.createIntegerAttribute(DATABASE_ID, collectionId, 'level', false, undefined, undefined, 1);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'timezone', 50, false, 'Asia/Tehran');
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'created_at', true);
    
    // ایجاد index
    await databases.createIndex(DATABASE_ID, collectionId, 'telegram_id_unique', 'unique', ['telegram_id']);
    
    console.log('✅ کالکشن Users ایجاد شد');
}

async function createTasksCollection() {
    const collectionId = 'tasks';
    
    await databases.createCollection(DATABASE_ID, collectionId, 'Tasks');
    
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'user_id', 36, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'title', 200, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'description', 1000, false);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'due_date', false);
    await databases.createEnumAttribute(DATABASE_ID, collectionId, 'priority', ['high', 'medium', 'low'], true, 'medium');
    await databases.createEnumAttribute(DATABASE_ID, collectionId, 'status', ['pending', 'completed', 'cancelled'], true, 'pending');
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'tags', 50, false, undefined, true);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'created_at', true);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'completed_at', false);
    
    await databases.createIndex(DATABASE_ID, collectionId, 'user_tasks', 'key', ['user_id']);
    await databases.createIndex(DATABASE_ID, collectionId, 'status_index', 'key', ['status']);
    await databases.createIndex(DATABASE_ID, collectionId, 'due_date_index', 'key', ['due_date']);
    
    console.log('✅ کالکشن Tasks ایجاد شد');
}

async function createHabitsCollection() {
    const collectionId = 'habits';
    
    await databases.createCollection(DATABASE_ID, collectionId, 'Habits');
    
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'user_id', 36, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'title', 200, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'description', 500, false);
    await databases.createEnumAttribute(DATABASE_ID, collectionId, 'frequency', ['daily', 'weekly', 'custom'], true, 'daily');
    await databases.createIntegerAttribute(DATABASE_ID, collectionId, 'target_days', false, undefined, undefined, undefined, true);
    await databases.createIntegerAttribute(DATABASE_ID, collectionId, 'current_streak', false, undefined, undefined, 0);
    await databases.createIntegerAttribute(DATABASE_ID, collectionId, 'longest_streak', false, undefined, undefined, 0);
    await databases.createFloatAttribute(DATABASE_ID, collectionId, 'completion_rate', false, undefined, undefined, 0.0);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'created_at', true);
    await databases.createBooleanAttribute(DATABASE_ID, collectionId, 'is_active', false, true);
    
    await databases.createIndex(DATABASE_ID, collectionId, 'user_habits', 'key', ['user_id']);
    await databases.createIndex(DATABASE_ID, collectionId, 'active_habits', 'key', ['is_active']);
    
    console.log('✅ کالکشن Habits ایجاد شد');
}

async function createEventsCollection() {
    const collectionId = 'calendar_events';
    
    await databases.createCollection(DATABASE_ID, collectionId, 'Calendar Events');
    
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'user_id', 36, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'title', 200, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'description', 1000, false);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'start_date', true);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'end_date', false);
    await databases.createBooleanAttribute(DATABASE_ID, collectionId, 'is_all_day', false, false);
    await databases.createEnumAttribute(DATABASE_ID, collectionId, 'recurrence', ['none', 'daily', 'weekly', 'monthly', 'yearly'], true, 'none');
    await databases.createIntegerAttribute(DATABASE_ID, collectionId, 'reminder_minutes', false, undefined, undefined, 15);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'created_at', true);
    
    await databases.createIndex(DATABASE_ID, collectionId, 'user_events', 'key', ['user_id']);
    await databases.createIndex(DATABASE_ID, collectionId, 'start_date_index', 'key', ['start_date']);
    
    console.log('✅ کالکشن Calendar Events ایجاد شد');
}

async function createCheckinsCollection() {
    const collectionId = 'habit_checkins';
    
    await databases.createCollection(DATABASE_ID, collectionId, 'Habit Check-ins');
    
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'habit_id', 36, true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'user_id', 36, true);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'checkin_date', true);
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'notes', 500, false);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'created_at', true);
    
    await databases.createIndex(DATABASE_ID, collectionId, 'habit_checkins', 'key', ['habit_id']);
    await databases.createIndex(DATABASE_ID, collectionId, 'user_checkins', 'key', ['user_id']);
    await databases.createIndex(DATABASE_ID, collectionId, 'checkin_date_index', 'key', ['checkin_date']);
    
    console.log('✅ کالکشن Habit Check-ins ایجاد شد');
}

async function createRewardsCollection() {
    const collectionId = 'user_rewards';
    
    await databases.createCollection(DATABASE_ID, collectionId, 'User Rewards');
    
    await databases.createStringAttribute(DATABASE_ID, collectionId, 'user_id', 36, true);
    await databases.createEnumAttribute(DATABASE_ID, collectionId, 'badge_type', ['task_master', 'habit_builder', 'consistent_user', 'early_bird', 'night_owl'], true);
    await databases.createIntegerAttribute(DATABASE_ID, collectionId, 'badge_level', false, undefined, undefined, 1);
    await databases.createDatetimeAttribute(DATABASE_ID, collectionId, 'earned_at', true);
    await databases.createIntegerAttribute(DATABASE_ID, collectionId, 'points_earned', false, undefined, undefined, 0);
    
    await databases.createIndex(DATABASE_ID, collectionId, 'user_rewards_index', 'key', ['user_id']);
    
    console.log('✅ کالکشن User Rewards ایجاد شد');
}

// اجرای اسکریپت
setupDatabase();
