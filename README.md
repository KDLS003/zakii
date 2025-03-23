
# MySQL Setup Guide for Fhaund-It Project

This guide provides all the MySQL commands you need to set up and manage the `fhaundit` database, using MySQL on an EC2 instance.

---

## ✅ 1. Connect to MySQL

### 🔹 On EC2 Instance:
```bash
mysql -u root -p
```
> Enter your MySQL root password when prompted.


## ✅ 2. Create Database and Use It
```sql
CREATE DATABASE fhaundit;
USE fhaundit;
```

---

## ✅ 3. Create `items` Table
```sql
CREATE TABLE items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  dateFound DATE NOT NULL,
  location VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'Available',
  image LONGTEXT
);
```

---

## ✅ 4. View Tables in the Database
```sql
SHOW TABLES;
```

---

## ✅ 5. Check Table Structure
```sql
DESCRIBE items;
```

---

## ✅ 6. Query Items (Test)
```sql
SELECT * FROM items;
```

---

## ✅ 7. Exit MySQL
```sql
exit;
```


