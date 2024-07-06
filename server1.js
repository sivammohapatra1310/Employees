import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

const employees = [];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Add this line to support JSON-encoded bodies
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  console.log(req.body);
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Find the employee by email
  const employee = employees.find(emp => emp.email === email);

  if (employee && password === 'password') {
    console.log(`Employee details: 
      First Name: ${employee.first_name}, 
      Last Name: ${employee.last_name}, 
      DOB: ${employee.dob}, 
      Gender: ${employee.gender}, 
      Contact Number: ${employee.contact_number}, 
      Email: ${employee.email}, 
      Address: ${employee.address}, 
      DOJ: ${employee.doj}, 
      Position ID: ${employee.position_id}, 
      Department ID: ${employee.department_id}, 
      Manager ID: ${employee.manager_id}`);

    res.send(`Employee details: 
      First Name: ${employee.first_name}, 
      Last Name: ${employee.last_name}, 
      DOB: ${employee.dob}, 
      Gender: ${employee.gender}, 
      Contact Number: ${employee.contact_number}, 
      Email: ${employee.email}, 
      Address: ${employee.address}, 
      DOJ: ${employee.doj}, 
      Position ID: ${employee.position_id}, 
      Department ID: ${employee.department_id}, 
      Manager ID: ${employee.manager_id}`);
  } else {
    console.log('Not logged in');
    res.send('Not logged in');
  }
});

app.post('/add-employee', (req, res) => {
  const {
    first_name, last_name, dob, gender, contact_number,
    email, address, doj, position_id, department_id, manager_id
  } = req.body;

  const newEmployee = {
    first_name, last_name, dob, gender, contact_number,
    email, address, doj, position_id, department_id, manager_id
  };

  employees.push(newEmployee);
  console.log(`Employee added: ${first_name} ${last_name}`);
  res.send('Employee added');
});

app.delete('/delete-employee', (req, res) => {
  const { email } = req.body;

  const index = employees.findIndex(employee => employee.email === email);
  if (index !== -1) {
    const deletedEmployee = employees.splice(index, 1)[0];
    console.log(`Employee with email: ${email} deleted`);
    res.send(`Employee with email: ${email} deleted`);
  } else {
    res.status(400).send('Employee not found');
  }
});

app.get('/employees', (req, res) => {
  console.log('Employees:', employees);
  res.json(employees);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
