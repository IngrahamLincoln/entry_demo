const { PrismaClient, Role } = require('../src/generated/prisma');

const prisma = new PrismaClient();

const userIdToMakeAdmin = 'user_2vWsIyJnTG8BD4SesBbiRCW3vYR';

async function main() {
  console.log(`Attempting to set role for user: ${userIdToMakeAdmin}`);

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userIdToMakeAdmin },
      data: { role: Role.ADMIN },
    });
    console.log(
      `Successfully updated user ${updatedUser.id} to role ${updatedUser.role}`
    );
  } catch (error: any) {
    if (error && error.code === 'P2025') {
      console.error(
        `Error: User with ID ${userIdToMakeAdmin} not found in the database.`
      );
      console.error(
        'Please ensure the user has logged in at least once to be present in the User table.'
      );
    } else {
      console.error('Failed to update user role:', error);
    }
    process.exit(1); // Exit with error code
  } finally {
    await prisma.$disconnect();
  }
}

main(); 