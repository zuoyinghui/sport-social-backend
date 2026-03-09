function success(res, data = {}, msg = 'success', code = 200) {
  return res.status(code).json({
    code,
    msg,
    data,
  })
}

function failure(res, msg = '请求失败', code = 500, data = null) {
  return res.status(code).json({
    code,
    msg,
    data,
  })
}

module.exports = {
  success,
  failure,
}
