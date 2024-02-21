require('dotenv').config();
const express = require('express');
const inquirer = require('inquirer');
const sequelize = require('./config/connection');
const { seedAll } = require('./seeds/index');

const Product = require('./models/Product');
const Category  = require('./models/Category');


const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(require('./routes'));

// checks if the database has been seeded if not it will seed the database
async function checkAndSeedDatabase() {
  if (process.env.SEED_DB === 'true') {
    try {
      await seedAll();
      console.log('Database seeded!');
    } catch (error) {
      console.error('Error during database seeding:', error);
    }
  }
}

// displays all products in the database in command line

async function displayProducts() {
  try {
    const products = await Product.findAll({
      include: [{ model: Category }] 
    });
    console.log("\nProducts List:");
    products.forEach(product => {
      console.log(`ID: ${product.id}, Name: ${product.product_name}, Price: ${product.price}, Stock: ${product.stock}, Category: ${product.category.category_name}`);
    });
    console.log("");
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}


// allows the user to view all products or exit the application (via inquirer)
async function runCLI() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: ['View all products', 'Exit'],
    },
  ]);

  switch (action) {
    case 'View all products':
      await displayProducts();
      break;
    case 'Exit':
      console.log('Goodbye!');
      process.exit();
      break;
  }

  await runCLI();
}

sequelize.sync({ force: true }).then(async () => {
  if (process.env.SEED_DB === 'true') {
    await checkAndSeedDatabase();
  }
  app.listen(PORT, () => console.log(`Now listening on port ${PORT}`));
  await runCLI();
});
