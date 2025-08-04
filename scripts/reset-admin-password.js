const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    // Hash new password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Update admin user password
    const updatedUser = await prisma.user.update({
      where: {
        username: 'mkalleche@gmail.com'
      },
      data: {
        password: hashedPassword
      }
    });
    
    console.log('✅ Admin password reset successfully!');
    console.log('Username: mkalleche@gmail.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword(); 