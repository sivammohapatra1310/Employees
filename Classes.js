class Employee {
    constructor(employee_id, first_name, last_name, dob, gender, contact_number, email_id, address, doj, position_id, department_id, manager_id) {
      this.employee_id = employee_id;
      this.first_name = first_name;
      this.last_name = last_name;
      this.dob = dob;
      this.gender = gender;
      this.contact_number = contact_number;
      this.email_id = email_id;
      this.address = address;
      this.doj = doj;
      this.position_id = position_id;
      this.department_id = department_id;
      this.manager_id = manager_id;
    }
  }
  class Department {
    constructor(department_id, department_name, location) {
      this.department_id = department_id;
      this.department_name = department_name;
      this.location = location;
    }
  }
  class Position {
    constructor(position_id, position_name, salary_grade) {
      this.position_id = position_id;
      this.position_name = position_name;
      this.salary_grade = salary_grade;
    }
  }
  class Position {
    constructor(position_id, position_name, salary_grade) {
      this.position_id = position_id;
      this.position_name = position_name;
      this.salary_grade = salary_grade;
    }
  }
  class Salary {
    constructor(salary_id, employee_id, amount) {
      this.salary_id = salary_id;
      this.employee_id = employee_id;
      this.amount = amount;
    }
  }
  