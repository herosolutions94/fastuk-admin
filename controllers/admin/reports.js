const pool  = require("../../config/db-connection");

const BaseController = require('../baseController');
const helpers = require("../../utils/helpers");

class ReportsController extends BaseController {
	async filterCompletedReportsView (req, res) {
		const {filter}=req.body;
		console.log(filter);
		console.log(req.body);
		let dateConditionRequests = '1=1'; // Default: return all rows
		let dateConditionUnix = '1=1'; // Default: return all rows

		if (filter === 'today') {
		    dateConditionRequests = `DATE(created_date) = CURDATE()`; // request_quote
		    dateConditionUnix = `DATE(FROM_UNIXTIME(created_at)) = CURDATE()`; // earnings & withdraw_requests
		} else if (filter === 'weekly') {
		    dateConditionRequests = `YEARWEEK(created_date) = YEARWEEK(NOW())`;
		    dateConditionUnix = `YEARWEEK(FROM_UNIXTIME(created_at)) = YEARWEEK(NOW())`;
		} else if (filter === 'monthly') {
		    dateConditionRequests = `MONTH(created_date) = MONTH(NOW()) 
		                             AND YEAR(created_date) = YEAR(NOW())`;
		    dateConditionUnix = `MONTH(FROM_UNIXTIME(created_at)) = MONTH(NOW()) 
		                         AND YEAR(FROM_UNIXTIME(created_at)) = YEAR(NOW())`;
		} else if (filter === 'yearly') {
		    dateConditionRequests = `YEAR(created_date) = YEAR(NOW())`;
		    dateConditionUnix = `YEAR(FROM_UNIXTIME(created_at)) = YEAR(NOW())`;
		}

		// Query for completed orders count
		const [completedOrdersCountResult] = await pool.query(
		    `SELECT COUNT(*) AS count FROM request_quote WHERE status = ? AND ${dateConditionRequests.replace(/created_at/g, 'created_date')}`,
		    ['completed']
		);
		console.log(`SELECT COUNT(*) AS count FROM request_quote WHERE status = 'completed' AND ${dateConditionRequests.replace(/created_at/g, 'created_date')}`);
		// Query for earnings
		const [earningsCountResult] = await pool.query(
		    `SELECT SUM(amount) AS earnings FROM earnings WHERE type='credit' AND status = ? AND ${dateConditionUnix.replace(/created_at/g, 'created_time')}`,
		    ['cleared']
		);
		console.log(`SELECT SUM(amount) AS earnings FROM earnings WHERE status = 'cleared' AND ${dateConditionUnix.replace(/created_at/g, 'created_time')}`);
		// Query for transactions
		const [transactionsCountResult] = await pool.query(
		    `SELECT SUM(t.amount) AS transactions 
		    FROM transactions t 
		    JOIN request_quote rq ON t.transaction_id = rq.id 
		    WHERE t.transaction_id IS NOT NULL 
		    AND t.transaction_id != 0 
		    AND rq.status = 'completed' 
		    AND ${dateConditionRequests.replace(/created_at/g, 'rq.created_date')}`
		);

		// Query for withdrawals
		const [withdrawAmountResult] = await pool.query(
		    `SELECT SUM(amount) AS amount FROM withdraw_requests WHERE status = ? AND ${dateConditionUnix}`,
		    ['cleared']
		);

		const completedOrdersCount = completedOrdersCountResult[0].count;
	    const earningsCount = earningsCountResult?.length > 0 ? earningsCountResult[0].earnings : 0;
	    const transactionsCount = transactionsCountResult?.length > 0 ? transactionsCountResult[0].transactions : 0;
	    const withdrawResult = withdrawAmountResult?.length > 0 ? withdrawAmountResult[0].amount : 0;
		console.log("withdrawResult:",withdrawAmountResult)
		return res.status(200).json({
	        status: 1,
	         stats: {
	                completedOrders: completedOrdersCount,
	                earnings:earningsCount ? earningsCount : 0,
	                transactions:transactionsCount ? transactionsCount : 0,
	                withdrawResult:withdrawResult ? withdrawResult : 0
	            },
	    });
	};
	async completedReportsView (req, res) {
	    try {
	        // Execute queries to fetch counts
	        
	        const [completedOrdersCountResult] = await pool.query(
	            'SELECT COUNT(*) AS count FROM request_quote WHERE status = ?',
	            ['completed'] 
	        );
	        const [earningsCountResult] = await pool.query('SELECT SUM(amount) AS earnings FROM earnings WHERE status=?',['cleared']);
	        const [transactionsCountResult] = await pool.query(`
	            SELECT SUM(t.amount) AS transactions 
	            FROM transactions t 
	            JOIN request_quote rq ON t.transaction_id = rq.id 
	            WHERE t.transaction_id IS NOT NULL 
	            AND t.transaction_id != 0 
	            AND rq.status = 'completed'
	        `);
	        const [withdrawAmountResult] = await pool.query('SELECT SUM(amount) AS amount FROM withdraw_requests WHERE status=?',['cleared']);


	        // Extract counts
	        const completedOrdersCount = completedOrdersCountResult[0].count;
	        const earningsCount = earningsCountResult?.length > 0 ? earningsCountResult[0].earnings : 0;
	        const transactionsCount = transactionsCountResult?.length > 0 ? transactionsCountResult[0].transactions : 0;
	        const withdrawResult = withdrawAmountResult?.length > 0 ? withdrawAmountResult[0].amount : 0;

	        // Render the admin dashboard with counts
	        res.render('admin/reports', {
	            layout: 'admin/layout',
	            stats: {
	                completedOrders: completedOrdersCount,
	                earnings:earningsCount ? earningsCount : 0,
	                transactions:transactionsCount ? transactionsCount : 0,
	                withdrawResult:withdrawResult ? withdrawResult : 0
	            },
	            type:'completed'
	        });
	    } catch (error) {
	        console.error('Error fetching dashboard stats:', error);
	        next(error); // Pass the error to the error-handling middleware
	    }
	};
	async inprogressReportsView (req, res) {
	    try {
	        // Execute queries to fetch counts
	        
	        const [completedOrdersCountResult] = await pool.query(
	            'SELECT COUNT(*) AS count FROM request_quote WHERE status = ?',
	            ['accepted'] 
	        );
	        const [transactionsCountResult] = await pool.query(`
	            SELECT SUM(t.amount) AS transactions 
	            FROM transactions t 
	            JOIN request_quote rq ON t.transaction_id = rq.id 
	            WHERE t.transaction_id IS NOT NULL 
	            AND t.transaction_id != 0 
	            AND rq.status = 'accepted'
	        `);
	        const [withdrawAmountResult] = await pool.query('SELECT SUM(amount) AS amount FROM withdraw_requests WHERE status=?',['accepted']);


	        // Extract counts
	        const completedOrdersCount = completedOrdersCountResult[0].count;
	        const transactionsCount = transactionsCountResult?.length > 0 ? transactionsCountResult[0].transactions : 0;
	        const withdrawResult = withdrawAmountResult?.length > 0 ? withdrawAmountResult[0].amount : 0;

	        // Render the admin dashboard with counts
	        res.render('admin/reports', {
	            layout: 'admin/layout',
	            stats: {
	                completedOrders: completedOrdersCount,
	                transactions:transactionsCount ? transactionsCount : 0,
	                withdrawResult:withdrawResult ? withdrawResult : 0
	            },
	            type:'inprogress'
	        });
	    } catch (error) {
	        console.error('Error fetching dashboard stats:', error);
	        next(error); // Pass the error to the error-handling middleware
	    }
	};
	
}
module.exports = new ReportsController();

