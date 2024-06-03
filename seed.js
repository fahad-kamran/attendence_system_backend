const adminSeeder = require('./seeders/adminSeeder');

adminSeeder().then(() => {
    console.log('Admin seeder executed successfully');
}).catch((err) => {
    console.error('Admin seeder failed:', err);
});
