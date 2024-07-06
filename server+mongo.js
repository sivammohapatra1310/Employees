import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient, ServerApiVersion } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

const uri = "mongodb+srv://sivammohapatra:User2004@cluster0.jlvlmmi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let employeesCollection, departmentsCollection, positionsCollection;
let employeeCounter = 1;
async function run() {
    try {
        await client.connect();
        const db = client.db("employee_management");
        employeesCollection = db.collection("employees");
        departmentsCollection = db.collection("departments");
        positionsCollection = db.collection("positions");
        console.log("Connected to MongoDB successfully!");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}
run().catch(console.dir);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const employee = await employeesCollection.findOne({ email });

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

app.post('/add-employee', async (req, res) => {
    const {
        first_name, last_name, dob, gender, contact_number,
        email, address, doj, position_name, department_name, manager_id
    } = req.body;

    const employee_id = `nte-${String(employeeCounter).padStart(3, '0')}`;
    const position_id = `${position_name}`;
    const department_id = `${department_name}`;

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
            await employeesCollection.insertOne(newEmployee);
            employeeCounter++;
            await updatePosition(position_name);
            await updateDepartment(department_name);
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


const reducePosition = async (position_name) => {
    console.log(position_name);
    const position = await positionsCollection.findOne({ position_name });
    if (position && position.count > 0) {
        await positionsCollection.updateOne({ position_name }, { $inc: { count: -1 } });
    }
};

const reduceDepartment = async (department_name) => {
    console.log(department_name);
    const department = await departmentsCollection.findOne({ department_name });
    if (department && department.count > 0) {
        await departmentsCollection.updateOne({ department_name }, { $inc: { count: -1 } });
    }
};

app.delete('/delete-employee', async (req, res) => {
    const { employee_id } = req.body;
    try {
        const employee = await employeesCollection.findOne({ employee_id });
        if (employee) {
            await employeesCollection.deleteOne({ employee_id });
            res.json({
                status: true,
                message: `Employee with id: ${employee_id} deleted`
            });
        } else {
            res.status(400).json({
                status: false,
                message: "Employee not found"
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
const updatePosition = async (position_name) => {
    const position = await positionsCollection.findOne({ position_name });
    if (position) {
        await positionsCollection.updateOne({ position_name }, { $inc: { count: 1 } });
    } else {
        await positionsCollection.insertOne({ position_name, count: 1 });
    }
};

const updateDepartment = async (department_name) => {
    const department = await departmentsCollection.findOne({ department_name });
    if (department) {
        await departmentsCollection.updateOne({ department_name }, { $inc: { count: 1 } });
    } else {
        await departmentsCollection.insertOne({ department_name, count: 1 });
    }
};



app.get('/employees', async (req, res) => {
    const token = req.query.age;
    const employees = await employeesCollection.find().toArray();

    if (employees.length === 0) {
        res.status(400).json({
            status: false,
            tokenn: token,
            message: "Unsuccessful Fetch"
        });
    } else {
        res.status(200).json({
            status: true,
            tokenn: token,
            data: employees,
            message: "Successful Fetch"
        });
    }
});

app.post('/postdepartments', async (req, res) => {
    const { department_name, manager_id } = req.body;

    const newDepartment = {department_name, manager_id, count: 0
    };

    try {
        let isValid = true;
        for (const field in newDepartment) {
            if (field!='count' &&  !newDepartment[field]) {
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
            await departmentsCollection.insertOne(newDepartment);
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

app.post('/postpositions', async (req, res) => {
    const {position_name, salary_grade } = req.body;

    const newPosition = {position_name, salary_grade, count: 0
    };

    try {
        let isValid = true;
        for (const field in newPosition) {
            if (field!='count' && !newPosition[field]) {
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
            await positionsCollection.insertOne(newPosition);
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

app.get('/printdepartments', async (req, res) => {
    const departments = await departmentsCollection.find().toArray();
    res.json(departments);
});

app.get('/printpositions', async (req, res) => {
    const positions = await positionsCollection.find().toArray();
    res.json(positions);
});

app.delete('/deleteposition', async (req, res) => {
    const { position_name } = req.body;

    try {
        // Find the position
        const position = await positionsCollection.findOne({ position_name });

        if (position) {
            const employeesToRemove = await employeesCollection.find({ position_id: position_name }).toArray();
            await employeesCollection.deleteMany({ position_id: position_name });
            console.log(employeesToRemove)
            // Decrease the count for the positions of the deleted employees
            for (const employee of employeesToRemove) {
                await departmentsCollection.updateOne(
                    { department_name: employee.department_id },
                    { $inc: { count: -1 } }
                );

            }

            // Remove the position
            await positionsCollection.deleteOne({ position_name });

            res.json({
                status: true,
                message: `Position with name: ${position_name} and all associated employees deleted`
            });
        } else {
            res.status(400).json({
                status: false,
                message: 'Position not found'
            });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
});

app.delete('/deletedepartment', async (req, res) => {
    const { department_name } = req.body;

    try {
        // Find the department
        const department = await departmentsCollection.findOne({ department_name });

        if (department) {
            // Get employees in the specified department
            const employeesToRemove = await employeesCollection.find({ department_id: department.department_name }).toArray();
            await employeesCollection.deleteMany({ department_id: department_name });
            console.log(employeesToRemove)
            // Decrease the count for the positions of the deleted employees
            for (const employee of employeesToRemove) {
                await positionsCollection.updateOne(
                    { position_name: employee.position_id },
                    { $inc: { count: -1 } }
                );
            }

            // Remove the department
            await departmentsCollection.deleteOne({ department_name });

            res.json({
                status: true,
                message: `Department with name: ${department_name} and all associated employees deleted`
            });
        } else {
            res.status(400).json({
                status: false,
                message: "Department not found"
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


app.delete('/delete-all', async (req, res) => {
    try {
        await employeesCollection.deleteMany({});
        await departmentsCollection.deleteMany({});
        await positionsCollection.deleteMany({});
        res.json({
            status: true,
            message: "All collections data deleted"
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            status: false,
            message: error.message,
        });
    }
});

// Update employee details
app.put('/update-employee', async (req, res) => {
    const { employee_id, updates } = req.body;

    try {
        const result = await employeesCollection.updateOne(
            { employee_id },
            { $set: updates }
        );

        if (result.modifiedCount > 0) {
            res.json({
                status: true,
                message: `Employee with id: ${employee_id} updated successfully`
            });
        } else {
            res.status(400).json({
                status: false,
                message: `Employee with id: ${employee_id} not found`
            });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
});

// Update department details
app.put('/update-department', async (req, res) => {
    const { department_name, updates } = req.body;

    try {
        const result = await departmentsCollection.updateOne(
            { department_name },
            { $set: updates }
        );

        if (result.modifiedCount > 0) {
            res.json({
                status: true,
                message: `Department with name: ${department_name} updated successfully`
            });
        } else {
            res.status(400).json({
                status: false,
                message: `Department with name: ${department_name} not found`
            });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
});

// Update position details
app.put('/update-position', async (req, res) => {
    const { position_name, updates } = req.body;

    try {
        const result = await positionsCollection.updateOne(
            { position_name },
            { $set: updates }
        );

        if (result.modifiedCount > 0) {
            res.json({
                status: true,
                message: `Position with name: ${position_name} updated successfully`
            });
        } else {
            res.status(400).json({
                status: false,
                message: `Position with name: ${position_name} not found`
            });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
});


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
