import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient, ServerApiVersion } from 'mongodb';
import mongoose from "mongoose"
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;


// import mongoose from "mongoose"
const uri = "mongodb+srv://sivammohapatra:User2004@cluster0.jlvlmmi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri)
  .then(() => console.log('MongoDB connected..........................'))
  .catch(err => console.log(err));

const mageSchema = new mongoose.Schema({ 
    name: { 
        type: String, 
        require: true
    }, 
    power_type: { 
        type: String, 
        require: true
    }, 
    mana_power: Number, 
    health: Number, 
    gold: Number 
}) 

const Mage = new mongoose.model("tweee", mageSchema) 

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

        // Set employeeCounter to the maximum employee ID + 1
        // employeeCounter=1;
        const maxEmployeeId = await getMaxEmployeeId();
        employeeCounter = maxEmployeeId ? maxEmployeeId + 1 : 1;

        console.log("Connected to MongoDB successfully!");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

async function getMaxEmployeeId() {
    try {
        const pipeline = [
            { $group: { _id: null, maxEmployeeId: { $max: { $toInt: { $substr: ["$employee_id", 4, -1] } } } } }
        ];
        const result = await employeesCollection.aggregate(pipeline).toArray();
        return result.length > 0 ? result[0].maxEmployeeId : null;
    } catch (error) {
        console.error("Error getting max employee ID:", error);
        return null;
    }
}

run().catch(console.dir);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/ddd', async (req, res) => {
    const mage_1 = new Mage({
      name: "Takashi",
      power_type: 'Element',
      mana_power: 200,
      health: 1000,
      gold: 10000
    });
  
    try {
      let data = await mage_1.save();
      console.log("mage_1;;;;;;;;",data);
      res.send('Mage saved successfully');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error saving mage');
    }
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
        email, address, doj, position_name, department_name
    } = req.body;

    try {
        const position = await positionsCollection.findOne({ position_name });
        const department = await departmentsCollection.findOne({ department_name });

        if (!position) {
            return res.status(400).json({
                status: false,
                message: "Invalid position_name"
            });
        }

        if (!department) {
            return res.status(400).json({
                status: false,
                message: "Invalid department_name"
            });
        }

        const employee_id = `nte-${String(employeeCounter).padStart(3, '0')}`;
        const position_id = position_name;
        const department_id = department_name;
        const manager_id = department.manager_id;

        const newEmployee = {
            employee_id, first_name, last_name, dob, gender, contact_number,
            email, address, doj, position_id, department_id, manager_id
        };

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
            await updatePosition(position_name, employee_id);
            await updateDepartment(department_name, employee_id);
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

const updatePosition = async (position_name, employee_id) => {
    const position = await positionsCollection.findOne({ position_name });
    if (position) {
        await positionsCollection.updateOne(
            { position_name },
            { $inc: { count: 1 }, $push: { employees: employee_id } }
        );
    } else {
        await positionsCollection.insertOne({
            position_name,
            count: 1,
            employees: [employee_id]
        });
    }
};

const updateDepartment = async (department_name, employee_id) => {
    const department = await departmentsCollection.findOne({ department_name });
    if (department) {
        await departmentsCollection.updateOne(
            { department_name },
            { $inc: { count: 1 }, $push: { employees: employee_id } }
        );
    } else {
        await departmentsCollection.insertOne({
            department_name,
            count: 1,
            employees: [employee_id]
        });
    }
};

app.delete('/delete-employee', async (req, res) => {
    const { employee_id } = req.body;
    try {
        const employee = await employeesCollection.findOne({ employee_id });
        if (employee) {
            await employeesCollection.deleteOne({ employee_id });
            await reducePosition(employee.position_id, employee_id);
            await reduceDepartment(employee.department_id, employee_id);
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

const reducePosition = async (position_name, employee_id) => {
    const position = await positionsCollection.findOne({ position_name });
    if (position && position.count > 0) {
        await positionsCollection.updateOne(
            { position_name },
            { $inc: { count: -1 }, $pull: { employees: employee_id } }
        );
    }
};

const reduceDepartment = async (department_name, employee_id) => {
    const department = await departmentsCollection.findOne({ department_name });
    if (department && department.count > 0) {
        await departmentsCollection.updateOne(
            { department_name },
            { $inc: { count: -1 }, $pull: { employees: employee_id } }
        );
    }
};

app.delete('/delete-department', async (req, res) => {
    const { department_name } = req.body;
    try {
        const department = await departmentsCollection.findOne({ department_name });
        if (department) {
            const employees = await employeesCollection.find({ department_id: department_name }).toArray();
            if (employees.length > 0) {
                const employeeIds = employees.map(emp => emp.employee_id);
                await employeesCollection.deleteMany({ department_id: department_name });
                await positionsCollection.updateMany(
                    { employees: { $in: employeeIds } },
                    { $pull: { employees: { $in: employeeIds } }, $inc: { count: -1 } }
                );
            }
            await departmentsCollection.deleteOne({ department_name });
            res.json({
                status: true,
                message: `Department with name: ${department_name} and its employees deleted`
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

app.delete('/delete-position', async (req, res) => {
    const { position_name } = req.body;
    try {
        const position = await positionsCollection.findOne({ position_name });
        if (position) {
            const employees = await employeesCollection.find({ position_id: position_name }).toArray();
            if (employees.length > 0) {
                const employeeIds = employees.map(emp => emp.employee_id);
                await employeesCollection.deleteMany({ position_id: position_name });
                await departmentsCollection.updateMany(
                    { employees: { $in: employeeIds } },
                    { $pull: { employees: { $in: employeeIds } }, $inc: { count: -1 } }
                );
            }
            await positionsCollection.deleteOne({ position_name });
            res.json({
                status: true,
                message: `Position with name: ${position_name} and its employees deleted`
            });
        } else {
            res.status(400).json({
                status: false,
                message: "Position not found"
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

app.get('/employees', async (req, res) => {
    const employees = await employeesCollection.find().toArray();
    if (employees.length === 0) {
        res.status(400).json({
            status: false,
            message: "No employees found"
        });
    } else {
        res.status(200).json({
            status: true,
            data: employees,
            message: "Employees fetched successfully"
        });
    }
});

app.post('/postdepartments', async (req, res) => {
    const { department_name, manager_id } = req.body;

    const newDepartment = { department_name, manager_id, count: 0, employees: [] };

    try {
        // Validate fields
        let isValid = true;
        for (const field in newDepartment) {
            if (field !== 'count' && field !== 'employees' && !newDepartment[field]) {
                isValid = false;
                break;
            }
        }
        if (!isValid) {
            return res.status(400).json({
                status: false,
                message: "All fields are required"
            });
        }

        // Check if department already exists
        const existingDepartment = await departmentsCollection.findOne({ department_name });
        if (existingDepartment) {
            return res.status(400).json({
                status: false,
                message: "Department already exists"
            });
        }

        // Insert the new department
        await departmentsCollection.insertOne(newDepartment);
        res.json({
            status: true,
            message: "Department Created",
            data: newDepartment
        });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            status: false,
            message: error.message,
        });
    }
});

app.post('/postpositions', async (req, res) => {
    const { position_name } = req.body;

    const newPosition = { position_name, count: 0, employees: [] };

    try {
        // Validate fields
        let isValid = true;
        for (const field in newPosition) {
            if (field !== 'count' && field !== 'employees' && !newPosition[field]) {
                isValid = false;
                break;
            }
        }
        if (!isValid) {
            return res.status(400).json({
                status: false,
                message: "All fields are required"
            });
        }

        // Check if position already exists
        const existingPosition = await positionsCollection.findOne({ position_name });
        if (existingPosition) {
            return res.status(400).json({
                status: false,
                message: "Position already exists"
            });
        }

        // Insert the new position
        await positionsCollection.insertOne(newPosition);
        res.json({
            status: true,
            message: "Position Created",
            data: newPosition
        });

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
app.patch('/update-employee', async (req, res) => {
    const { employee_id, first_name, last_name, dob, gender, contact_number, email, address, doj, position_name, department_name } = req.body;

    try {
        const updates = {};
        if (first_name) updates.first_name = first_name;
        if (last_name) updates.last_name = last_name;
        if (dob) updates.dob = dob;
        if (gender) updates.gender = gender;
        if (contact_number) updates.contact_number = contact_number;
        if (email) updates.email = email;
        if (address) updates.address = address;
        if (doj) updates.doj = doj;
        if (position_name) {
            const position = await positionsCollection.findOne({ position_name });
            if (!position) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid position_name"
                });
            }
            updates.position_id = position_name;
        }
        if (department_name) {
            const department = await departmentsCollection.findOne({ department_name });
            if (!department) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid department_name"
                });
            }
            updates.department_id = department_name;
            updates.manager_id = department.manager_id;
        }

        const result = await employeesCollection.updateOne({ employee_id }, { $set: updates });

        if (result.modifiedCount > 0) {
            if (updates.position_id) {
                await updatePosition(updates.position_id, employee_id);
            }
            if (updates.department_id) {
                await updateDepartment(updates.department_id, employee_id);
            }
            res.json({
                status: true,
                message: `Employee with id: ${employee_id} updated`,
                data: updates
            });
        } else {
            res.status(400).json({
                status: false,
                message: "Employee not found or no fields updated"
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
