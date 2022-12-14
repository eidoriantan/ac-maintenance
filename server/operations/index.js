
const express = require('express')
const database = require('../database')
const asyncWrap = require('../utils/async-wrap')
const router = express.Router()

router.get('/', asyncWrap(async (req, res) => {
  const order = req.query.order

  const units = await database.query('SELECT `units`.*,`offices`.`name` AS `office_name` FROM `units` JOIN `offices` ON `offices`.`id`=`units`.`office_id`')
  const operations = await database.query('SELECT * FROM `operations`')
  const encodedOperations = []

  for (let i = 0; i < units.length; i++) {
    const unit = units[i]
    encodedOperations.push({
      id: 0,
      unit_id: unit.id,
      office: unit.office_name,
      area: unit.area,
      operation: 0,
      description: 'Unit was added to database.',
      date_start: unit.date_encoded,
      date_end: unit.date_encoded
    })
  }

  const mergedOps = operations.concat(encodedOperations).sort((a, b) => {
    const aTime = (new Date(a.date_end)).getTime()
    const bTime = (new Date(b.date_end)).getTime()
    if (aTime === bTime) return order === 'asc' ? a.unit_id - b.unit_id : b.unit_id - a.unit_id
    else return order === 'asc' ? aTime - bTime : bTime - aTime
  })

  res.json({
    success: true,
    message: 'No errors.',
    operations: mergedOps
  })
}))

router.post('/', asyncWrap(async (req, res) => {
  const unitId = req.body.id
  const operation = req.body.operation
  const dateStart = req.body['date-start']
  const dateEnd = req.body['date-end']
  const description = req.body.description

  if (!unitId || !operation || !dateStart || !dateEnd) {
    res.json({
      success: false,
      message: 'Invalid parameters'
    })
    return
  }

  const units = await database.query('SELECT * FROM `units` WHERE `id`=?', [unitId])
  if (units.length === 0) {
    res.json({
      success: false,
      message: 'Unit does not exist'
    })
    return
  }

  if (!['1', '2', '3'].includes(operation)) {
    res.json({
      success: false,
      message: 'Invalid operation'
    })
    return
  }

  const query = 'INSERT INTO `operations` (`unit_id`,`operation`,`description`,`date_start`,`date_end`) VALUES (?, ?, ?, ?, ?)'
  await database.query(query, [unitId, operation, description, dateStart, dateEnd])
  res.json({
    success: true,
    message: 'No errors.'
  })
}))

module.exports = router
