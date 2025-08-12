// appwrite-function/src/main.js
const { Client, Databases, Functions, Messaging } = require('appwrite');
const { Telegraf, Markup } = require('telegraf');

// کد کامل ربات را اینجا قرار دهید

// package.json
{
  "name": "persian-life-management-bot",
  "version": "1.0.0",
  "description": "Persian Life Management Telegram Bot with Appwrite Backend",
  "main": "bot.js",
  "scripts": {
    "start": "node bot.js",
    "dev": "nodemon bot.js"
  },
  "dependencies": {
    "telegraf": "^4.15.0",
    "appwrite": "^13.0.0",
    "moment-jalaali": "^0.10.0",
    "dotenv": "^16.3.1",
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}



// bot.js
const { Telegraf, Markup } = require('telegraf');
const { Client, Databases, Users, Functions, ID, Query } = require('appwrite');
const moment = require('moment-jalaali');
const cron = require('node-cron');
require('dotenv').config();

// Persian/Farsi utilities
const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const toPersianDigits = (num) => num.toString().replace(/\d/g, d => persianNumbers[d]);
const toEnglishDigits = (str) => str.replace(/[۰-۹]/g, d => persianNumbers.indexOf(d));

// Jalali calendar utilities
moment.loadPersian({ dialect: 'persian-modern' });
const jalaliMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];
const jalaliWeekdays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

// Appwrite setup
const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const users = new Users(client);
const functions = new Functions(client);

const DATABASE_ID = 'life_management';
const COLLECTIONS = {
    USERS: 'users',
    TASKS: 'tasks',
    HABITS: 'habits',
    EVENTS: 'calendar_events',
    CHECKINS: 'habit_checkins',
    REWARDS: 'user_rewards'
};

// Bot setup
const bot = new Telegraf(process.env.BOT_TOKEN);

// Persian messages and UI components
const messages = {
    welcome: `🌟 سلام! به ربات مدیریت زندگی خوش آمدید
    
این ربات به شما کمک می‌کند:
📋 مدیریت وظایف روزانه
🎯 پیگیری عادات مفید
📅 برنامه‌ریزی رویدادها
🏆 کسب امتیاز و جایزه

برای شروع، از منوی زیر استفاده کنید:`,
    
    mainMenu: '🏠 منوی اصلی',
    tasks: '📋 وظایف',
    habits: '🎯 عادات',
    calendar: '📅 تقویم',
    reports: '📊 گزارشات',
    settings: '⚙️ تنظیمات',
    
    addTask: '➕ افزودن وظیفه',
    editTask: '✏️ ویرایش وظیفه',
    deleteTask: '🗑️ حذف وظیفه',
    completeTask: '✅ تکمیل وظیفه',
    
    addHabit: '➕ افزودن عادت',
    checkHabit: '✅ انجام عادت',
    habitStreak: '🔥 رکورد پیاپی',
    
    todayTasks: 'وظایف امروز',
    upcomingTasks: 'وظایف آینده',
    completedTasks: 'وظایف انجام‌شده',
    
    back: '🔙 بازگشت',
    cancel: '❌ لغو',
    save: '💾 ذخیره',
    
    enterTaskTitle: '📝 عنوان وظیفه را وارد کنید:',
    enterTaskDescription: '📄 توضیحات وظیفه را وارد کنید:',
    selectTaskPriority: '⭐ اولویت وظیفه را انتخاب کنید:',
    selectDueDate: '📅 تاریخ مهلت را انتخاب کنید:',
    
    priorityHigh: '🔴 بالا',
    priorityMedium: '🟡 متوسط',
    priorityLow: '🟢 پایین',
    
    taskSaved: '✅ وظیفه با موفقیت ذخیره شد!',
    taskCompleted: '🎉 آفرین! وظیفه تکمیل شد.',
    habitCompleted: '🔥 عالی! عادت امروز انجام شد.',
    
    weeklyReport: `📊 گزارش هفتگی شما:
    
📋 وظایف تکمیل‌شده: {completedTasks}
🎯 عادات انجام‌شده: {completedHabits}
🔥 بهترین رکورد: {bestStreak} روز
⭐ امتیاز کسب‌شده: {points} XP

{motivationalMessage}`,

    motivationalMessages: [
        '🌟 شما قهرمان زندگی خودتان هستید!',
        '🚀 هر روز قدمی به جلو برمی‌دارید!',
        '💪 استقامت شما قابل تحسین است!',
        '🏆 موفقیت در راه است، ادامه دهید!',
        '✨ شما الهام‌بخش هستید!',
        '🎯 تمرکز شما بی‌نظیر است!',
        '🌈 زندگی زیبا در انتظار شماست!'
    ]
};

// Database helper functions
class DatabaseHelper {
    static async createUser(telegramId, firstName, lastName = '') {
        try {
            return await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.USERS,
                ID.unique(),
                {
                    telegram_id: telegramId,
                    first_name: firstName,
                    last_name: lastName,
                    xp_points: 0,
                    level: 1,
                    created_at: new Date().toISOString()
                }
            );
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    static async getUser(telegramId) {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.USERS,
                [Query.equal('telegram_id', telegramId)]
            );
            return response.documents[0] || null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    static async createTask(userId, title, description, dueDate, priority, tags = []) {
        try {
            return await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.TASKS,
                ID.unique(),
                {
                    user_id: userId,
                    title,
                    description,
                    due_date: dueDate,
                    priority,
                    tags,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }
            );
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }

    static async getUserTasks(userId, status = null) {
        try {
            const queries = [Query.equal('user_id', userId)];
            if (status) queries.push(Query.equal('status', status));
            
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.TASKS,
                queries
            );
            return response.documents;
        } catch (error) {
            console.error('Error getting tasks:', error);
            return [];
        }
    }

    static async completeTask(taskId) {
        try {
            return await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.TASKS,
                taskId,
                {
                    status: 'completed',
                    completed_at: new Date().toISOString()
                }
            );
        } catch (error) {
            console.error('Error completing task:', error);
            throw error;
        }
    }
}

// UI Builder class
class UIBuilder {
    static mainMenuKeyboard() {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback(`📋 ${messages.tasks}`, 'menu_tasks'),
                Markup.button.callback(`🎯 ${messages.habits}`, 'menu_habits')
            ],
            [
                Markup.button.callback(`📅 ${messages.calendar}`, 'menu_calendar'),
                Markup.button.callback(`📊 ${messages.reports}`, 'menu_reports')
            ],
            [
                Markup.button.callback(`⚙️ ${messages.settings}`, 'menu_settings')
            ]
        ]);
    }

    static tasksMenuKeyboard() {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback(`➕ ${messages.addTask}`, 'add_task'),
                Markup.button.callback(`📋 ${messages.todayTasks}`, 'today_tasks')
            ],
            [
                Markup.button.callback(`🔮 ${messages.upcomingTasks}`, 'upcoming_tasks'),
                Markup.button.callback(`✅ ${messages.completedTasks}`, 'completed_tasks')
            ],
            [
                Markup.button.callback(`🔙 ${messages.back}`, 'main_menu')
            ]
        ]);
    }

    static priorityKeyboard() {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback(messages.priorityHigh, 'priority_high'),
                Markup.button.callback(messages.priorityMedium, 'priority_medium'),
                Markup.button.callback(messages.priorityLow, 'priority_low')
            ],
            [
                Markup.button.callback(`❌ ${messages.cancel}`, 'cancel')
            ]
        ]);
    }

    static jalaliCalendarKeyboard(year, month) {
        const startOfMonth = moment().jYear(year).jMonth(month - 1).jDate(1);
        const daysInMonth = startOfMonth.jDaysInMonth();
        const firstDayOfWeek = startOfMonth.jDay();
        
        const keyboard = [];
        
        // Header with month name and navigation
        keyboard.push([
            Markup.button.callback('◀️', `cal_prev_${year}_${month}`),
            Markup.button.callback(`${jalaliMonths[month - 1]} ${toPersianDigits(year)}`, 'noop'),
            Markup.button.callback('▶️', `cal_next_${year}_${month}`)
        ]);
        
        // Weekday headers
        keyboard.push(jalaliWeekdays.map(day => 
            Markup.button.callback(day, 'noop')
        ));
        
        // Calendar days
        let week = [];
        
        // Empty cells for days before month starts
        for (let i = 0; i < firstDayOfWeek; i++) {
            week.push(Markup.button.callback(' ', 'noop'));
        }
        
        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            week.push(Markup.button.callback(
                toPersianDigits(day), 
                `cal_day_${year}_${month}_${day}`
            ));
            
            if (week.length === 7) {
                keyboard.push(week);
                week = [];
            }
        }
        
        // Add remaining week if not empty
        if (week.length > 0) {
            while (week.length < 7) {
                week.push(Markup.button.callback(' ', 'noop'));
            }
            keyboard.push(week);
        }
        
        keyboard.push([
            Markup.button.callback(`🔙 ${messages.back}`, 'main_menu')
        ]);
        
        return Markup.inlineKeyboard(keyboard);
    }

    static taskActionKeyboard(taskId) {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback(`✅ تکمیل`, `complete_task_${taskId}`),
                Markup.button.callback(`✏️ ویرایش`, `edit_task_${taskId}`)
            ],
            [
                Markup.button.callback(`🗑️ حذف`, `delete_task_${taskId}`),
                Markup.button.callback(`🔙 بازگشت`, 'menu_tasks')
            ]
        ]);
    }
}

// Session management
const userSessions = new Map();

class UserSession {
    constructor(userId) {
        this.userId = userId;
        this.state = 'idle';
        this.data = {};
    }

    setState(state, data = {}) {
        this.state = state;
        this.data = { ...this.data, ...data };
    }

    getData(key) {
        return this.data[key];
    }

    setData(key, value) {
        this.data[key] = value;
    }

    clear() {
        this.state = 'idle';
        this.data = {};
    }
}

function getSession(userId) {
    if (!userSessions.has(userId)) {
        userSessions.set(userId, new UserSession(userId));
    }
    return userSessions.get(userId);
}

// Bot handlers
bot.start(async (ctx) => {
    const telegramId = ctx.from.id;
    let user = await DatabaseHelper.getUser(telegramId);
    
    if (!user) {
        user = await DatabaseHelper.createUser(
            telegramId,
            ctx.from.first_name,
            ctx.from.last_name || ''
        );
    }
    
    await ctx.reply(messages.welcome, UIBuilder.mainMenuKeyboard());
});

// Main menu handlers
bot.action('main_menu', async (ctx) => {
    await ctx.editMessageText(messages.welcome, UIBuilder.mainMenuKeyboard());
});

bot.action('menu_tasks', async (ctx) => {
    await ctx.editMessageText(`📋 ${messages.tasks}`, UIBuilder.tasksMenuKeyboard());
});

bot.action('menu_habits', async (ctx) => {
    await ctx.editMessageText('🎯 بخش عادات - در حال توسعه...', 
        Markup.inlineKeyboard([[Markup.button.callback(`🔙 ${messages.back}`, 'main_menu')]]));
});

bot.action('menu_calendar', async (ctx) => {
    const today = moment();
    const year = today.jYear();
    const month = today.jMonth() + 1;
    
    await ctx.editMessageText(
        `📅 تقویم ${jalaliMonths[month - 1]} ${toPersianDigits(year)}`,
        UIBuilder.jalaliCalendarKeyboard(year, month)
    );
});

bot.action('menu_reports', async (ctx) => {
    const user = await DatabaseHelper.getUser(ctx.from.id);
    const tasks = await DatabaseHelper.getUserTasks(user.$id, 'completed');
    const completedThisWeek = tasks.filter(task => {
        const completedDate = moment(task.completed_at);
        return completedDate.isAfter(moment().subtract(7, 'days'));
    }).length;
    
    const motivationalMessage = messages.motivationalMessages[
        Math.floor(Math.random() * messages.motivationalMessages.length)
    ];
    
    const reportText = messages.weeklyReport
        .replace('{completedTasks}', toPersianDigits(completedThisWeek))
        .replace('{completedHabits}', toPersianDigits(0))
        .replace('{bestStreak}', toPersianDigits(0))
        .replace('{points}', toPersianDigits(user.xp_points))
        .replace('{motivationalMessage}', motivationalMessage);
    
    await ctx.editMessageText(reportText, 
        Markup.inlineKeyboard([[Markup.button.callback(`🔙 ${messages.back}`, 'main_menu')]]));
});

// Task management handlers
bot.action('add_task', async (ctx) => {
    const session = getSession(ctx.from.id);
    session.setState('waiting_task_title');
    
    await ctx.editMessageText(messages.enterTaskTitle,
        Markup.inlineKeyboard([[Markup.button.callback(`❌ ${messages.cancel}`, 'menu_tasks')]]));
});

bot.action('today_tasks', async (ctx) => {
    const user = await DatabaseHelper.getUser(ctx.from.id);
    const tasks = await DatabaseHelper.getUserTasks(user.$id, 'pending');
    
    const todayTasks = tasks.filter(task => {
        const dueDate = moment(task.due_date);
        return dueDate.isSame(moment(), 'day');
    });
    
    if (todayTasks.length === 0) {
        await ctx.editMessageText('📋 شما وظیفه‌ای برای امروز ندارید!',
            Markup.inlineKeyboard([[Markup.button.callback(`🔙 ${messages.back}`, 'menu_tasks')]]));
        return;
    }
    
    let tasksList = '📋 وظایف امروز:\n\n';
    todayTasks.forEach((task, index) => {
        const priority = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
        tasksList += `${toPersianDigits(index + 1)}. ${priority} ${task.title}\n`;
        if (task.description) tasksList += `   📄 ${task.description}\n`;
        tasksList += '\n';
    });
    
    const keyboard = [];
    todayTasks.forEach(task => {
        keyboard.push([Markup.button.callback(
            `✅ ${task.title.substring(0, 20)}...`, 
            `complete_task_${task.$id}`
        )]);
    });
    keyboard.push([Markup.button.callback(`🔙 ${messages.back}`, 'menu_tasks')]);
    
    await ctx.editMessageText(tasksList, Markup.inlineKeyboard(keyboard));
});

// Calendar handlers
bot.action(/cal_prev_(\d+)_(\d+)/, async (ctx) => {
    const [, year, month] = ctx.match;
    const newDate = moment().jYear(parseInt(year)).jMonth(parseInt(month) - 2);
    const newYear = newDate.jYear();
    const newMonth = newDate.jMonth() + 1;
    
    await ctx.editMessageText(
        `📅 تقویم ${jalaliMonths[newMonth - 1]} ${toPersianDigits(newYear)}`,
        UIBuilder.jalaliCalendarKeyboard(newYear, newMonth)
    );
});

bot.action(/cal_next_(\d+)_(\d+)/, async (ctx) => {
    const [, year, month] = ctx.match;
    const newDate = moment().jYear(parseInt(year)).jMonth(parseInt(month));
    const newYear = newDate.jYear();
    const newMonth = newDate.jMonth() + 1;
    
    await ctx.editMessageText(
        `📅 تقویم ${jalaliMonths[newMonth - 1]} ${toPersianDigits(newYear)}`,
        UIBuilder.jalaliCalendarKeyboard(newYear, newMonth)
    );
});

bot.action(/cal_day_(\d+)_(\d+)_(\d+)/, async (ctx) => {
    const [, year, month, day] = ctx.match;
    const selectedDate = moment().jYear(parseInt(year)).jMonth(parseInt(month) - 1).jDate(parseInt(day));
    
    const user = await DatabaseHelper.getUser(ctx.from.id);
    const tasks = await DatabaseHelper.getUserTasks(user.$id);
    const dayTasks = tasks.filter(task => {
        const taskDate = moment(task.due_date);
        return taskDate.isSame(selectedDate, 'day');
    });
    
    let message = `📅 ${selectedDate.format('jYYYY/jMM/jDD')}\n\n`;
    
    if (dayTasks.length === 0) {
        message += 'هیچ وظیفه‌ای برای این روز ندارید.';
    } else {
        message += '📋 وظایف این روز:\n';
        dayTasks.forEach((task, index) => {
            const priority = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
            const status = task.status === 'completed' ? '✅' : '⏳';
            message += `${toPersianDigits(index + 1)}. ${status} ${priority} ${task.title}\n`;
        });
    }
    
    await ctx.editMessageText(message,
        Markup.inlineKeyboard([
            [Markup.button.callback('➕ افزودن وظیفه', `add_task_date_${year}_${month}_${day}`)],
            [Markup.button.callback(`🔙 بازگشت به تقویم`, 'menu_calendar')]
        ]));
});

// Task completion handler
bot.action(/complete_task_(.+)/, async (ctx) => {
    const taskId = ctx.match[1];
    
    try {
        await DatabaseHelper.completeTask(taskId);
        
        // Award XP points
        const user = await DatabaseHelper.getUser(ctx.from.id);
        await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.USERS,
            user.$id,
            { xp_points: user.xp_points + 10 }
        );
        
        await ctx.answerCbQuery('🎉 آفرین! وظیفه تکمیل شد و ۱۰ امتیاز کسب کردید!');
        await ctx.editMessageText(messages.taskCompleted,
            Markup.inlineKeyboard([[Markup.button.callback(`🔙 ${messages.back}`, 'menu_tasks')]]));
    } catch (error) {
        await ctx.answerCbQuery('❌ خطا در تکمیل وظیفه');
    }
});

// Text message handlers
bot.on('text', async (ctx) => {
    const session = getSession(ctx.from.id);
    const text = ctx.message.text;
    
    switch (session.state) {
        case 'waiting_task_title':
            session.setData('title', text);
            session.setState('waiting_task_description');
            await ctx.reply(messages.enterTaskDescription,
                Markup.inlineKeyboard([[Markup.button.callback(`❌ ${messages.cancel}`, 'menu_tasks')]]));
            break;
            
        case 'waiting_task_description':
            session.setData('description', text);
            session.setState('waiting_task_priority');
            await ctx.reply(messages.selectTaskPriority, UIBuilder.priorityKeyboard());
            break;
    }
});

// Priority selection handlers
bot.action('priority_high', async (ctx) => {
    await handlePrioritySelection(ctx, 'high');
});

bot.action('priority_medium', async (ctx) => {
    await handlePrioritySelection(ctx, 'medium');
});

bot.action('priority_low', async (ctx) => {
    await handlePrioritySelection(ctx, 'low');
});

async function handlePrioritySelection(ctx, priority) {
    const session = getSession(ctx.from.id);
    session.setData('priority', priority);
    
    const user = await DatabaseHelper.getUser(ctx.from.id);
    const title = session.getData('title');
    const description = session.getData('description');
    const dueDate = moment().add(1, 'day').toISOString(); // Default to tomorrow
    
    try {
        await DatabaseHelper.createTask(user.$id, title, description, dueDate, priority);
        session.clear();
        
        await ctx.editMessageText(messages.taskSaved,
            Markup.inlineKeyboard([[Markup.button.callback(`🔙 ${messages.back}`, 'menu_tasks')]]));
    } catch (error) {
        await ctx.editMessageText('❌ خطا در ذخیره وظیفه',
            Markup.inlineKeyboard([[Markup.button.callback(`🔙 ${messages.back}`, 'menu_tasks')]]));
    }
}

// Cancel action
bot.action('cancel', async (ctx) => {
    const session = getSession(ctx.from.id);
    session.clear();
    await ctx.editMessageText(messages.welcome, UIBuilder.mainMenuKeyboard());
});

// No-op handler for inactive buttons
bot.action('noop', async (ctx) => {
    await ctx.answerCbQuery();
});

// Reminder system using cron
cron.schedule('0 9 * * *', async () => {
    // Daily morning reminder at 9 AM
    console.log('Sending daily reminders...');
    // Implementation for sending reminders to all users
});

cron.schedule('0 20 * * SUN', async () => {
    // Weekly report every Sunday at 8 PM
    console.log('Sending weekly reports...');
    // Implementation for sending weekly reports
});

// Error handler
bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('❌ خطایی رخ داده است. لطفاً دوباره تلاش کنید.');
});

// Start the bot
console.log('🚀 Persian Life Management Bot is starting...');
bot.launch().then(() => {
    console.log('✅ Bot is running!');
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// appwrite-schema.js
// Appwrite Database Collections Schema

const collections = [
    {
        name: 'users',
        id: 'users',
        attributes: [
            { key: 'telegram_id', type: 'integer', required: true },
            { key: 'first_name', type: 'string', size: 100, required: true },
            { key: 'last_name', type: 'string', size: 100, required: false },
            { key: 'xp_points', type: 'integer', default: 0 },
            { key: 'level', type: 'integer', default: 1 },
            { key: 'timezone', type: 'string', size: 50, default: 'Asia/Tehran' },
            { key: 'created_at', type: 'datetime', required: true }
        ],
        indexes: [
            { key: 'telegram_id_index', type: 'unique', attributes: ['telegram_id'] }
        ]
    },
    {
        name: 'tasks',
        id: 'tasks',
        attributes: [
            { key: 'user_id', type: 'string', size: 36, required: true },
            { key: 'title', type: 'string', size: 200, required: true },
            { key: 'description', type: 'string', size: 1000, required: false },
            { key: 'due_date', type: 'datetime', required: false },
            { key: 'priority', type: 'enum', elements: ['high', 'medium', 'low'], default: 'medium' },
            { key: 'status', type: 'enum', elements: ['pending', 'completed', 'cancelled'], default: 'pending' },
            { key: 'tags', type: 'string', array: true, required: false },
            { key: 'created_at', type: 'datetime', required: true },
            { key: 'completed_at', type: 'datetime', required: false }
        ],
        indexes: [
            { key: 'user_tasks', type: 'key', attributes: ['user_id'] },
            { key: 'status_index', type: 'key', attributes: ['status'] },
            { key: 'due_date_index', type: 'key', attributes: ['due_date'] }
        ]
    },
    {
        name: 'habits',
        id: 'habits',
        attributes: [
            { key: 'user_id', type: 'string', size: 36, required: true },
            { key: 'title', type: 'string', size: 200, required: true },
            { key: 'description', type: 'string', size: 500, required: false },
            { key: 'frequency', type: 'enum', elements: ['daily', 'weekly', 'custom'], default: 'daily' },
            { key: 'target_days', type: 'integer', array: true, required: false },
            { key: 'current_streak', type: 'integer', default: 0 },
            { key: 'longest_streak', type: 'integer', default: 0 },
            { key: 'completion_rate', type: 'float', default: 0.0 },
            { key: 'created_at', type: 'datetime', required: true },
            { key: 'is_active', type: 'boolean', default: true }
        ],
        indexes: [
            { key: 'user_habits', type: 'key', attributes: ['user_id'] },
            { key: 'active_habits', type: 'key', attributes: ['is_active'] }
        ]
    },
    {
        name: 'habit_checkins',
        id: 'habit_checkins',
        attributes: [
            { key: 'habit_id', type: 'string', size: 36, required: true },
            { key: 'user_id', type: 'string', size: 36, required: true },
            { key: 'checkin_date', type: 'datetime', required: true },
            { key: 'notes', type: 'string', size: 500, required: false },
            { key: 'created_at', type: 'datetime', required: true }
        ],
        indexes: [
            { key: 'habit_checkins', type: 'key', attributes: ['habit_id'] },
            { key: 'user_checkins', type: 'key', attributes: ['user_id'] },
            { key: 'checkin_date_index', type: 'key', attributes: ['checkin_date'] }
        ]
    },
    {
        name: 'calendar_events',
        id: 'calendar_events',
        attributes: [
            { key: 'user_id', type: 'string', size: 36, required: true },
            { key: 'title', type: 'string', size: 200, required: true },
            { key: 'description', type: 'string', size: 1000, required: false },
            { key: 'start_date', type: 'datetime', required: true },
            { key: 'end_date', type: 'datetime', required: false },
            { key: 'is_all_day', type: 'boolean', default: false },
            { key: 'recurrence', type: 'enum', elements: ['none', 'daily', 'weekly', 'monthly', 'yearly'], default: 'none' },
            { key: 'reminder_minutes', type: 'integer', default: 15 },
            { key: 'created_at', type: 'datetime', required: true }
        ],
        indexes: [
            { key: 'user_events', type: 'key', attributes: ['user_id'] },
            { key: 'start_date_index', type: 'key', attributes: ['start_date'] }
        ]
    },
    {
        name: 'user_rewards',
        id: 'user_rewards',
        attributes: [
            { key: 'user_id', type: 'string', size: 36, required: true },
            { key: 'badge_type', type: 'enum', elements: ['task_master', 'habit_builder', 'consistent_user', 'early_bird', 'night_owl'] },
            { key: 'badge_level', type: 'integer', default: 1 },
            { key: 'earned_at', type: 'datetime', required: true },
            { key: 'points_earned', type: 'integer', default: 0 }
        ],
        indexes: [
            { key: 'user_rewards', type: 'key', attributes: ['user_id'] }
        ]
    }
];

module.exports = { collections };

// deployment.md
# 🚀 Persian Life Management Bot - Deployment Guide

## 📋 Prerequisites

1. **Node.js** (v16 or higher)
2. **Telegram Bot Token** from @BotFather
3. **Appwrite Instance** (Cloud or Self-hosted)

## 🔧 Setup Instructions

### 1. Create Telegram Bot
```bash
# Message @BotFather on Telegram:
/start
/newbot
# Follow the prompts and save your bot token
```

### 2. Setup Appwrite

#### Cloud Version (Recommended)
1. Go to [Appwrite Cloud](https://cloud.appwrite.io)
2. Create a new project
3. Note your Project ID and Endpoint

#### Self-hosted Version
```bash
docker run -it --rm \
    --volume /var/run/docker.sock:/var/run/docker.sock \
    --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
    --entrypoint="install" \
    appwrite/appwrite:1.4.13
```

### 3. Create Database Collections

```javascript
// Run this script to create collections
const { Client, Databases, ID } = require('appwrite');
const { collections } = require('./appwrite-schema');

const client = new Client()
    .setEndpoint('YOUR_ENDPOINT')
    .setProject('YOUR_PROJECT_ID')
    .setKey('YOUR_API_KEY');

const databases = new Databases(client);

async function createCollections() {
    const databaseId = 'life_management';
    
    // Create database
    await databases.create(databaseId, 'Life Management DB');
    
    // Create collections
    for (const collection of collections) {
        await databases.createCollection(
            databaseId,
            collection.id,
            collection.name
        );
        
        // Create attributes
        for (const attr of collection.attributes) {
            // Handle different attribute types
            if (attr.type === 'string') {
                await databases.createStringAttribute(
                    databaseId, collection.id, attr.key,
                    attr.size, attr.required, attr.default, attr.array
                );
            } else if (attr.type === 'integer') {
                await databases.createIntegerAttribute(
                    databaseId, collection.id, attr.key,
                    attr.required, attr.min, attr.max, attr.default, attr.array
                );
            }
            // Add other types as needed...
        }
        
        // Create indexes
        for (const index of collection.indexes || []) {
            await databases.createIndex(
                databaseId, collection.id, index.key,
                index.type, index.attributes, index.orders
            );
        }
    }
}

createCollections().catch(console.error);
```

### 4. Environment Configuration

Create `.env` file:
```env
BOT_TOKEN=your_telegram_bot_token_here
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_API_KEY=your_api_key
PORT=3000
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Run the Bot

#### Development
```bash
npm run dev
```

#### Production
```bash
npm start
```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

USER node

CMD ["npm", "start"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  life-bot:
    build: .
    environment:
      - BOT_TOKEN=${BOT_TOKEN}
      - APPWRITE_PROJECT_ID=${APPWRITE_PROJECT_ID}
      - APPWRITE_ENDPOINT=${APPWRITE_ENDPOINT}
      - APPWRITE_API_KEY=${APPWRITE_API_KEY}
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
```

Run with:
```bash
docker-compose up -d
```

## ☁️ Cloud Deployment

### Heroku
```bash
# Install Heroku CLI
heroku create your-bot-name
heroku config:set BOT_TOKEN=your_token
heroku config:set APPWRITE_PROJECT_ID=your_project_id
heroku config:set APPWRITE_ENDPOINT=your_endpoint
heroku config:set APPWRITE_API_KEY=your_api_key
git push heroku main
```

### Railway
```bash
# Install Railway CLI
railway login
railway new
railway add
railway deploy
```

### DigitalOcean App Platform
1. Create new app
2. Connect GitHub repository
3. Set environment variables
4. Deploy

## 🔒 Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **User Isolation**: Ensure users can only access their own data
3. **Rate Limiting**: Implement rate limiting for API calls
4. **Input Validation**: Validate all user inputs
5. **HTTPS**: Always use HTTPS in production

## 📊 Monitoring & Logging

Add logging middleware:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

bot.use((ctx, next) => {
    logger.info(`${ctx.from.id}: ${ctx.message?.text || ctx.callbackQuery?.data}`);
    return next();
});
```

## 🚨 Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check bot token
   - Verify internet connection
   - Check Telegram Bot API status

2. **Database errors**
   - Verify Appwrite connection
   - Check collection permissions
   - Ensure proper indexes are created

3. **Persian text display issues**
   - Ensure UTF-8 encoding
   - Check font support
   - Verify RTL text handling

### Debug Mode
```javascript
// Enable debug logging
process.env.DEBUG = 'telegraf:*';
```

## 📈 Performance Optimization

1. **Database Queries**: Use proper indexes and pagination
2. **Caching**: Implement Redis for session management
3. **Connection Pooling**: Use connection pooling for database
4. **Memory Management**: Monitor memory usage and implement cleanup

## 🔄 Updates & Maintenance

1. **Regular Updates**: Keep dependencies updated
2. **Backup Strategy**: Regular database backups
3. **Monitoring**: Set up monitoring and alerting
4. **User Feedback**: Implement feedback collection system

## 📞 Support

For support and bug reports, please create an issue in the project repository.

## 📝 License

This project is licensed under the MIT License.

// (همان کدی که قبلاً ارائه شد)

module.exports = async ({ req, res, log, error }) => {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

    const bot = new Telegraf(process.env.BOT_TOKEN);
    
    // تنظیمات ربات...
    
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            return res.json({ success: true });
        } catch (err) {
            error('Telegram update error:', err);
            return res.json({ error: err.message }, 500);
        }
    }
    
    return res.json({ message: 'Telegram bot is running!' });
};
