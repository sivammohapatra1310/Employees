

import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { on } from 'events';
import { time } from 'console';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

const employees = [];
const departments = [];
const positions = [];
let employeeCounter = 1;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const employee = employees.find(emp => emp.email === email);

    if (employee && password === 'password') {
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
        res.send('Not logged in');
    }
});

app.post('/add-employee', (req, res) => {
    const {
        first_name, last_name, dob, gender, contact_number,
        email, address, doj, position_name, department_name, manager_id
    } = req.body;

    const employee_id = `nte-${String(employeeCounter).padStart(3, '0')}`;
    const position_id = `${position_name.slice(0, 3).toUpperCase()}_${first_name.toUpperCase()}`;
    const department_id = `${department_name.slice(0, 4).toUpperCase()}_${first_name.toUpperCase()}`;

    const newEmployee = {
        employee_id, first_name, last_name, dob, gender, contact_number,
        email, address, doj, position_id, department_id, manager_id
    };

    try {
        let isValid = true;
        for (const field in newEmployee) {
            if (!newEmployee[field]) {
                isValid = false;
                break;
            }
        }
        if (!isValid) {
            res.status(400).json({
                status: false,
                message: "All fields are required"
            });
        } else {
            employees.push(newEmployee);
            employeeCounter++;
            updatePosition(position_name);
            updateDepartment(department_name);
            res.json({
                status: true,
                message: "Employee Created",
                data: newEmployee
            });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            status: false,
            message: error.message,
        });
    }
});

const updatePosition = (position_name) => {
    const position = positions.find(pos => pos.position_name === position_name);
    if (position) {
        position.count += 1;
    } else {
        positions.push({ position_name, count: 1 });
    }
};

const updateDepartment = (department_name) => {
    const department = departments.find(dept => dept.department_name === department_name);
    if (department) {
        department.count += 1;
    } else {
        departments.push({ department_name, count: 1 });
    }
};

app.delete('/delete-employee', (req, res) => {
    const { employee_id } = req.body;
    const index = employees.findIndex(employee => employee.employee_id === employee_id);

    if (index !== -1) {
        // const employee = employees[index];
        // x=employee.department_name;
        // // Reduce count in the associated department
        // for(i in departments){
        //     if(i.department_name==x){
        //         i.count--;
        //     }
        // }

        // Remove the employee
        employees.splice(index, 1);

        res.send(`Employee with id: ${employee_id} deleted`);
    } else {
        res.status(400).send('Employee not found');
    }
});


app.get('/employees', (req, res) => {
    const token = req.query.age;
    console.log(employees)
    if (employees.length==0) {
        res.status(400).json({
            status: false,
            tokenn: token,
            message: "Unsuccessful Fetch"
        })
    }
    else {
        res.status(200).json({
            status: true,
            tokenn: token,
            data: employees,
            message: "Successful Fetch"
        });
    }
});

app.post('/postdepartments', (req, res) => {
    const { department_id, department_name, manager_id } = req.body;

    const newDepartment = {
        department_id, department_name, manager_id, count: 0
    };

    try {
        let isValid = true;
        for (const field in newDepartment) {
            if (!newDepartment[field]) {
                isValid = false;
                break;
            }
        }
        if (!isValid) {
            res.status(400).json({
                status: false,
                message: "All fields are required"
            });
        } else {
            departments.push(newDepartment);
            res.json({
                status: true,
                message: "Department Created",
                data: newDepartment
            });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            status: false,
            message: error.message,
        });
    }
});

app.post('/postpositions', (req, res) => {
    const { position_id, position_name, salary_grade } = req.body;

    const newPosition = {
        position_id, position_name, salary_grade, count: 0
    };

    try {
        let isValid = true;
        for (const field in newPosition) {
            if (!newPosition[field]) {
                isValid = false;
                break;
            }
        }
        if (!isValid) {
            res.status(400).json({
                status: false,
                message: "All fields are required"
            });
        } else {
            positions.push(newPosition);
            res.json({
                status: true,
                message: "Position Created",
                data: newPosition
            });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            status: false,
            message: error.message,
        });
    }
});

app.get('/printdepartments', (req, res) => {
    console.log(departments);
    res.json(departments);
});

app.get('/printpositions', (req, res) => {
    res.json(positions);
});

app.delete('/deleteposition', (req, res) => {
    const { position_name } = req.body;

    // Find the position index
    const posIndex = positions.findIndex(pos => pos.position_name === position_name);

    if (posIndex !== -1) {
        // Remove employees in the specified position
        const employeesToRemove = employees.filter(emp => emp.position_id.startsWith(position_name.slice(0, 3).toUpperCase()));
        employeesToRemove.forEach(emp => {
            const empIndex = employees.findIndex(e => e.email === emp.email);
            if (empIndex !== -1) {
                employees.splice(empIndex, 1);
            }
        });

        // Remove the position
        positions.splice(posIndex, 1);
        res.send(`Position with name: ${position_name} and all associated employees deleted`);
    } else {
        res.status(400).send('Position not found');
    }
});

app.delete('/deletedepartment', (req, res) => {
    const { department_name } = req.body;
    
    // Log the departments for debugging
    console.log(departments);
    
    // Find the department index
    const deptIndex = departments.findIndex(dept => dept.department_name === department_name);

    if (deptIndex !== -1) {
        // Remove employees in the specified department
        const employeesToRemove = employees.filter(emp => emp.department_id.startsWith(department_name.slice(0, 4).toUpperCase()));
        employeesToRemove.forEach(emp => {
            const empIndex = employees.findIndex(e => e.email === emp.email);
            if (empIndex !== -1) {
                employees.splice(empIndex, 1);
            }
        });

        // Remove the department
        departments.splice(deptIndex, 1);
        res.send(`Department with name: ${department_name} and all associated employees deleted`);
    } else {
        res.status(400).send('Department not found');
    }
});



app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

