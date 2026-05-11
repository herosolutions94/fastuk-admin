const RiderModel = require("../models/riderModel");
const MemberModel = require("../models/memberModel");
const helpers = require("../utils/helpers");

const rider = new RiderModel();
const member = new MemberModel();


module.exports.processRiderCharges = async ({
    order_id,
    rider_id,
    adminData
}) => {
    const riderPercentage = Number(adminData?.rider_percentage || 0);
    const created_time = Math.floor(Date.now() / 1000);

    let riderHandballEarning = 0;
    let riderWaitingEarning = 0;

    /* HAND BALL */
    const totalHandballCharges =
        await rider?.getTotalHandballCharges(order_id, rider_id);

    if (totalHandballCharges > 0) {
        riderHandballEarning =
            Number(totalHandballCharges);;

        await helpers?.insertEarningLogs({
            user_id: rider_id,
            amount: riderHandballEarning,
            // type: "handball_charges",
            status: "pending",
            created_time,
            order_id,
            earning_type: "handball_charges"
        });

        await member?.updateRequestQuoteData(order_id, {
            rider_handball_charges: riderHandballEarning
        });
    }

    /* WAITING */
    const totalWaitingCharges =
        await rider?.getTotalWaitingCharges(order_id, rider_id);

    if (totalWaitingCharges > 0) {
        riderWaitingEarning =
            (totalWaitingCharges * riderPercentage) / 100;

        await helpers?.insertEarningLogs({
            user_id: rider_id,
            amount: riderWaitingEarning,
            // type: "waiting_charges",
            status: "pending",
            order_id,
            created_time,
            order_id,
            earning_type: "waiting_charges"
        });

        await member?.updateRequestQuoteData(order_id, {
            rider_waiting_charges: riderWaitingEarning
        });
    }

    return {
        riderHandballEarning,
        riderWaitingEarning
    };
};
