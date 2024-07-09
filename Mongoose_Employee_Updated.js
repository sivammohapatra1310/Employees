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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position',
        required: true
    },
    department_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
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
});

const positionSchema = new mongoose.Schema({
    position_name: {
        type: String,
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
        const position = await Position.findById(position_id);
        const department = await Department.findById(department_id);

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

    const newPosition = new Position({ position_name});

    try {
        let isValid = true;
        for (const field in newPosition.toObject()) {
            if ( !newPosition[field]) {
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

    const newDepartment = new Department({ department_name, manager_id });

    try {
        let isValid = true;
        for (const field in newDepartment.toObject()) {
            if ( !newDepartment[field]) {
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

app.delete('/delete-employee', async (req, res) => {
    const { employee_id } = req.body;
    try {
        const employee = await Employee.findOne({ employee_id });
        if (employee) {
            await Employee.deleteOne({ employee_id });
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

//
app.delete('/delete-department', async (req, res) => {
    const { department_id1 } = req.body;
    try {
        const department = await Department.findOne({ _id: department_id1 });
        if (department) {
            const employees = await Employee.find({ department_id: department_id1 }).exec();
            if (employees.length > 0) {
                const employeeIds = employees.map(emp => emp.employee_id);
                await Employee.deleteMany({ department_id: department_id1 });
                
            }
            await Department.deleteOne({ _id: department_id1 });
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

//
app.delete('/delete-position', async (req, res) => {
    const { position_id1 } = req.body;
    try {
        const position = await Position.findOne({ _id: position_id1 });
        if (position) {
            const employees = await Employee.find({ position_id: position_id1 }).exec();
            if (employees.length > 0) {
                const employeeIds = employees.map(emp => emp.employee_id);
                await Employee.deleteMany({ position_id: position_id1 });
            }
            await Position.deleteOne({ _id: position_id1 });
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

//
app.get('/printdepartments', async (req, res) => {
    try {
        const departments = await Department.find({});
    
        if (departments.length === 0) {
            return res.status(400).json({
                status: false,
                message: "Department is Empty"
            });
        } else {
            return res.json({
                status: true,
                departments: departments
            });
        }
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err.message
        });
    }
    
});

//
app.get('/printpositions', async (req, res) => {
    try {
        const positions = await Position.find({});
    
        if (positions.length === 0) {
            return res.status(400).json({
                status: false,
                message: "Positions are Empty"
            });
        } else {
            return res.json({
                status: true,
                positions: positions
            });
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            status: false,
            message: error.message
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


app.get('/getmanager', async (req, res) => {
    try {
        const { employee_id } = req.body;
        const employee = await Employee.findOne({ employee_id });

        if (!employee) {
            return res.status(400).json({
                status: false,
                message: "Employee not found"
            });
        }

        const department = await Department.findById(employee.department_id);

        if (!department) {
            return res.status(400).json({
                status: false,
                message: "Department not found"
            });
        }

        const manager_id = department.manager_id;

        // 1. Count of employees in the same department
        const deptEmployeeCount = await Employee.countDocuments({ department_id: employee.department_id });

        // 2. Count of employees in the same position
        const posnEmployeeCount = await Employee.countDocuments({ position_id: employee.position_id });

        // 3. List of employee IDs in the same department
        const deptEmployeeIds = await Employee.find({ department_id: employee.department_id }, 'employee_id');

        // 4. List of employee IDs in the same position
        const posnEmployeeIds = await Employee.find({ position_id: employee.position_id }, 'employee_id');

        res.status(200).json({
            status: true,
            manager_id: manager_id,
            deptEmployeeCount: deptEmployeeCount,
            posnEmployeeCount: posnEmployeeCount,
            deptEmployeeIds: deptEmployeeIds.map(emp => emp.employee_id),
            posnEmployeeIds: posnEmployeeIds.map(emp => emp.employee_id),
            message: `Data for employee ${employee_id} fetched successfully`
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            status: false,
            message: error.message,
        });
    }
});

// app.get('/countemployees', )


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


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
