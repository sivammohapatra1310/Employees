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
