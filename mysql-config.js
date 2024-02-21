const mysql = require('mysql2/promise');

const sqlProperties = {
    host: "ec2-47-128-164-24.ap-southeast-1.compute.amazonaws.com",
    user: "clusteradmin",
    password: "QC0lJasdfaCNzYXNkZmFYWwmKasfJK",
    database: "you_know_user_service",
    port: 6446,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
    debug: false
}

const pool = mysql.createPool(sqlProperties);

setInterval(async () => {
    const connection = await pool.getConnection();
    try {
      await connection.query('SELECT 1');
    } catch (error) {
      console.error('Error sending keep-alive query:', error);
    } finally {
      connection.release();
    }
  }, 5 * 60 * 1000);

async function query(sql, params) {
    const connection = await pool.getConnection();
    try{
        const [rows, fields] = await connection.execute(sql, params);
        return rows;
    } catch (error) {
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = { query }