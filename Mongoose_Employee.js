import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

const uri = "mongodb+srv://sivammohapatra:User2004@cluster0.jlvlmmi.mongodb.net/Mongoose_Employee?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Schemas
const employeeSchema = new mongoose.Schema({
    employee_id: {
        type: String,
        required: true
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    dob: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    contact_number: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    doj: {
        type: String,
        required: true
    },
    position_id: {
        type: String,
        required: true
    },
    department_id: {
        type: String,
        required: true
    },
});

const departmentSchema = new mongoose.Schema({
    department_name: {
        type: String,
        required: true
    },
    manager_id: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        required: true
    },
});

const positionSchema = new mongoose.Schema({
    position_name: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        required: true
    },
});

// Models
const Employee = mongoose.model('Employee', employeeSchema);
const Department = mongoose.model('Department', departmentSchema);
const Position = mongoose.model('Position', positionSchema);

let employeeCounter = 1;

async function getMaxEmployeeId() {
    try {
        const result = await Employee.aggregate([
            { $group: { _id: null, maxEmployeeId: { $max: { $toInt: { $substr: ["$employee_id", 4, -1] } } } } }
        ]);
        return result.length > 0 ? result[0].maxEmployeeId : null;
    } catch (error) {
        console.error("Error getting max employee ID:", error);
        return null;
    }
}

(async () => {
    try {
        await mongoose.connection;
        const maxEmployeeId = await getMaxEmployeeId();
        employeeCounter = maxEmployeeId ? maxEmployeeId + 1 : 1;
        console.log("Connected to MongoDB successfully!");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
})();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const employee = await Employee.findOne({ email });

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
      `);
    } else {
        res.send('Not logged in');
    }
});

app.post('/add-employee', async (req, res) => {
    const {
        first_name, last_name, dob, gender, contact_number,
        email, address, doj, position_id, department_id
    } = req.body;

    try {
        const position = await Position.findOne({ position_id });
        const department = await Department.findOne({ department_id });

        if (!position) {
            return res.status(400).json({
                status: false,
                message: "Invalid position_id"
            });
        }

        if (!department) {
            return res.status(400).json({
                status: false,
                message: "Invalid department_id"
            });
        }

        const employee_id = `nte-${String(employeeCounter).padStart(3, '0')}`;

        const newEmployee = new Employee({
            employee_id, first_name, last_name, dob, gender, contact_number,
            email, address, doj, position_id, department_id
        });

        let isValid = true;
        for (const field in newEmployee.toObject()) {
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
            await newEmployee.save();
            employeeCounter++;
            await updatePosition(position_id);
            await updateDepartment(department_id);
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

app.post('/postpositions', async (req, res) => {
    const { position_name } = req.body;

    const newPosition = new Position({ position_name, count: 0 });

    try {
        let isValid = true;
        for (const field in newPosition.toObject()) {
            if (field !== 'count' && !newPosition[field]) {
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

        const existingPosition = await Position.findOne({ position_name });
        if (existingPosition) {
            return res.status(400).json({
                status: false,
                message: "Position already exists"
            });
        }

        await newPosition.save();
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

app.post('/postdepartments', async (req, res) => {
    const { department_name, manager_id } = req.body;

    const newDepartment = new Department({ department_name, manager_id, count: 0 });

    try {
        let isValid = true;
        for (const field in newDepartment.toObject()) {
            if (field !== 'count' &&  !newDepartment[field]) {
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

        const existingDepartment = await Department.findOne({ department_name });
        if (existingDepartment) {
            return res.status(400).json({
                status: false,
                message: "Department already exists"
            });
        }

        await newDepartment.save();
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

const updatePosition = async (position_id) => {
    const position = await Position.findOne({ position_id });
    if (position) {
        await Position.updateOne(
            { position_id },
            { $inc: { count: 1 } }
        );
    } else {
        const newPosition = new Position({
            position_name,
            count: 1,
        });
        await newPosition.save();
    }
};

const updateDepartment = async (department_id) => {
    const department = await Department.findOne({ department_id });
    if (department) {
        await Department.updateOne(
            { department_id },
            { $inc: { count: 1 }}
        );
    } else {
        const newDepartment = new Department({
            department_id,
            count: 1,
        });
        await newDepartment.save();
    }
};

app.delete('/delete-employee', async (req, res) => {
    const { employee_id } = req.body;
    try {
        const employee = await Employee.findOne({ employee_id });
        if (employee) {
            await Employee.deleteOne({ employee_id });
            await reducePosition(employee.position_id);
            await reduceDepartment(employee.department_id);
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

const reducePosition = async (position_id) => {
    const position = await Position.findOne({ position_id });
    if (position && position.count > 0) {
        await Position.updateOne(
            { position_id },
            { $inc: { count: -1 } }
        );
    }
};

const reduceDepartment = async (department_id) => {
    const department = await Department.findOne({ department_id });
    if (department && department.count > 0) {
        await Department.updateOne(
            { department_id },
            { $inc: { count: -1 } }
        );
    }
};

app.delete('/delete-department', async (req, res) => {
    const { department_id1 } = req.body;
    try {
        const department = await Department.findOne({ department_id1 });
        if (department) {
            const employees = await Employee.find({ department_id: department_id1 }).exec();
            if (employees.length > 0) {
                const employeeIds = employees.map(emp => emp.employee_id);
                await Employee.deleteMany({ department_id: department_id1});
                await Position.updateMany(
                    { employees: { $in: employeeIds } },
                    {  $inc: { count: -1 } }
                );
            }
            await Department.deleteOne({ department_id1 });
            res.json({
                status: true,
                message: `Department with id: ${department_id1} and its employees deleted`
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
    const { position_id1 } = req.body;
    try {
        const position = await Position.findOne({ position_id1 });
        if (position) {
            const employees = await Employee.find({ position_id: position_id1 }).exec();
            if (employees.length > 0) {
                const employeeIds = employees.map(emp => emp.employee_id);
                await Employee.deleteMany({ position_id: position_id1 });
                await Department.updateMany(
                    { employees: { $in: employeeIds } },
                    { $inc: { count: -1 } }
                );
            }
            await Position.deleteOne({ position_id1 });
            res.json({
                status: true,
                message: `Position with id : ${position_id1} and its employees deleted`
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

app.delete('/delete-all', async (req, res) => {
    try {
        await Employee.deleteMany({});
        await Department.deleteMany({});
        await Position.deleteMany({});
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

app.get('/printdepartments', async (req, res) => {
    try {
        const departments = await Department.find({});
        res.json(departments);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            status: false,
            message: error.message,
        });
    }
});

app.get('/printpositions', async (req, res) => {
    try {
        const positions = await Position.find({});
        res.json(positions);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            status: false,
            message: error.message,
        });
    }
});


app.get('/employees', async (req, res) => {
    try {
        const employees = await Employee.find({});
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
