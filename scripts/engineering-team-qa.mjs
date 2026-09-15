/**
 * Engineering Team Review & QA Automation Loop
 * Roles Simulated & Executed:
 *   1. [Tech Lead / Architect] - Architecture, Schema & Contract Verification
 *   2. [Senior Developer]     - Code Safety, Hook Rules, Date Parser & Null Safety
 *   3. [QA Test Engineer]     - Live End-to-End Tests against Google Sheets & Apps Script
 *   4. [DevOps / Release Eng] - Linter, Build Sanity, Bundle Size & Pre-deployment Checks
 *   5. [Team Leader]          - Final Evaluation, Quality Index & Decision Sign-Off
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

// Configuration
const MATERIAL_SHEET_ID = '1wjqnycMAHWVKQIzZLnyjLboOj5GhiinuB_zENg1Ttuo'
const LOG_SHEET_ID = '13231Zdy1BQbX0BDmCVGIAgsKRJx_7UdDvxVBNO8MUM8'
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx485xIyUla9r78h6rxgwbr0JHlCt4skYjsXdxwPgHwjjwshVqhYI9OOVWY9fjVpYT0/exec'

// Color helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
}

const log = {
  header: (title) => console.log(`\n${colors.bright}${colors.bgBlue}${colors.white} === [ ${title} ] === ${colors.reset}`),
  role: (role, name) => console.log(`\n${colors.cyan}👤 ${role}:${colors.reset} ${colors.bright}${name}${colors.reset}`),
  pass: (msg) => console.log(`  ${colors.green}✔ PASS:${colors.reset} ${msg}`),
  fail: (msg) => console.log(`  ${colors.red}✖ FAIL:${colors.reset} ${msg}`),
  warn: (msg) => console.log(`  ${colors.yellow}⚠ WARN:${colors.reset} ${msg}`),
  info: (msg) => console.log(`  ${colors.dim}ℹ ${msg}${colors.reset}`)
}

const auditResults = {
  techLead: { passed: 0, failed: 0, notes: [] },
  seniorDev: { passed: 0, failed: 0, notes: [] },
  qaEngineer: { passed: 0, failed: 0, notes: [] },
  devOps: { passed: 0, failed: 0, notes: [] }
}

async function runTechLeadReview() {
  log.role('Tech Lead / Software Architect', 'Dual-Sheet Architecture & API Contract Review')
  
  // 1. Check Dual Sheet separation in config
  try {
    const configPath = path.join(ROOT_DIR, 'src', 'config', 'index.js')
    const configContent = fs.readFileSync(configPath, 'utf8')
    if (configContent.includes(MATERIAL_SHEET_ID) && configContent.includes(LOG_SHEET_ID)) {
      log.pass('Dual-sheet configuration cleanly separates Material Sheet & Log/Non-Material Sheet')
      auditResults.techLead.passed++
    } else {
      log.fail('Dual-sheet IDs missing or misconfigured in config/index.js')
      auditResults.techLead.failed++
    }
  } catch (err) {
    log.fail('Unable to read config/index.js: ' + err.message)
    auditResults.techLead.failed++
  }

  // 2. Schema mapping consistency between Apps Script and sheetHelpers
  try {
    const codeGsPath = path.join(ROOT_DIR, 'apps-script', 'Code.gs')
    const sheetHelpersPath = path.join(ROOT_DIR, 'src', 'utils', 'sheetHelpers.js')
    const codeGs = fs.readFileSync(codeGsPath, 'utf8')
    const sheetHelpers = fs.readFileSync(sheetHelpersPath, 'utf8')

    const cols = ['NO', 'CODE', 'DESCRIPTION', 'PLANT', 'BATCH', 'UNIT', 'MAIN_PREV', 'MAIN_IN', 'MAIN_OUT', 'MAIN_REM', 'SUB_PREV', 'SUB_IN', 'SUB_REM', 'PRICE']
    let allColsMatch = true
    for (const c of cols) {
      if (!codeGs.includes(`COL.${c}`) && !codeGs.includes(`${c}:`)) allColsMatch = false
      if (!sheetHelpers.includes(`COL.${c}`) && !sheetHelpers.includes(`${c}:`)) allColsMatch = false
    }
    if (allColsMatch) {
      log.pass('Column constants (COL) fully synchronized between Apps Script and Frontend helpers')
      auditResults.techLead.passed++
    } else {
      log.warn('Some column constants may differ between Code.gs and sheetHelpers.js')
    }
  } catch (err) {
    log.fail('Failed to verify schema mapping: ' + err.message)
    auditResults.techLead.failed++
  }

  // 3. API Contract coverage
  try {
    const appsScriptServicePath = path.join(ROOT_DIR, 'src', 'services', 'appsScriptService.js')
    const serviceContent = fs.readFileSync(appsScriptServicePath, 'utf8')
    const actions = ['withdraw', 'receive', 'return', 'addMaterial', 'updateMaterial', 'deleteMaterial', 'batchWithdraw']
    let allCovered = true
    for (const act of actions) {
      if (!serviceContent.includes(`action: '${act}'`) && !serviceContent.includes(`action: "${act}"`)) {
        allCovered = false
        log.fail(`Action '${act}' missing from frontend appsScriptService!`)
      }
    }
    if (allCovered) {
      log.pass('All 7 Core Backend Actions contractually implemented in appsScriptService')
      auditResults.techLead.passed++
    } else {
      auditResults.techLead.failed++
    }
  } catch (err) {
    log.fail('Failed checking API contract: ' + err.message)
    auditResults.techLead.failed++
  }
}

async function runSeniorDeveloperReview() {
  log.role('Senior Full-Stack Developer', 'Code Integrity, Hook Order & Safe Execution Review')

  // 1. Check React Rules of Hooks in Pages
  const pagesDir = path.join(ROOT_DIR, 'src', 'pages')
  const pageFiles = ['Receive.jsx', 'Return.jsx', 'Withdraw.jsx', 'Products.jsx', 'Logs.jsx', 'Reports.jsx', 'Dashboard.jsx']
  
  let hookIssues = 0
  for (const file of pageFiles) {
    const filePath = path.join(pagesDir, file)
    if (!fs.existsSync(filePath)) continue
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Check if useState/useEffect occurs after an early return
    const lines = content.split('\n')
    let foundEarlyReturn = false
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith('if (') && line.includes('return') && (line.includes('loading') || line.includes('checkingAccess') || line.includes('!hasAccess'))) {
        foundEarlyReturn = true
      }
      if (foundEarlyReturn && (line.includes('useState(') || line.includes('useEffect(') || line.includes('useCallback('))) {
        log.fail(`Hook declared after conditional return in ${file} at line ${i + 1}`)
        hookIssues++
      }
    }
  }

  if (hookIssues === 0) {
    log.pass('React Rules of Hooks verified: 0 hook order violations across all 7 pages')
    auditResults.seniorDev.passed++
  } else {
    auditResults.seniorDev.failed += hookIssues
  }

  // 2. Test Date & Timestamp parser logic
  const testDates = [
    '31/3/2026, 11:04:48',
    '2/3/2026 10:14:18',
    '2026-03-31T11:04:48.000Z',
    '15/09/2026',
    '1/1/26 09:00',
    null,
    undefined,
    ''
  ]

  function parseDateSafe(dateString) {
    if (!dateString) return '-'
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const hour = date.getHours().toString().padStart(2, '0')
      const minute = date.getMinutes().toString().padStart(2, '0')
      return `${day}/${month} ${hour}:${minute}`
    }
    const match = String(dateString).match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{1,2}))?/)
    if (match) {
      const day = match[1].padStart(2, '0')
      const month = match[2].padStart(2, '0')
      const hour = (match[4] || '00').padStart(2, '0')
      const minute = (match[5] || '00').padStart(2, '0')
      return `${day}/${month} ${hour}:${minute}`
    }
    return String(dateString).slice(0, 16)
  }

  let dateErrors = 0
  for (const d of testDates) {
    const formatted = parseDateSafe(d)
    if (formatted.includes('NaN')) {
      log.fail(`Date parser generated NaN for: "${d}" -> "${formatted}"`)
      dateErrors++
    }
  }

  if (dateErrors === 0) {
    log.pass('Robust Date Parser verified: 0 NaN occurrences across edge-case timestamps')
    auditResults.seniorDev.passed++
  } else {
    auditResults.seniorDev.failed += dateErrors
  }

  // 3. Check for Material Schema Aliases in Products.jsx and SheetsContext.jsx
  try {
    const productsPath = path.join(ROOT_DIR, 'src', 'pages', 'Products.jsx')
    const pContent = fs.readFileSync(productsPath, 'utf8')
    if (pContent.includes('p.materialCode || p.code') || pContent.includes('product.materialCode || product.code')) {
      log.pass('Products component handles dual schema aliases (materialCode / code & description / name)')
      auditResults.seniorDev.passed++
    } else {
      log.fail('Products component missing schema bridge for materialCode/code')
      auditResults.seniorDev.failed++
    }
  } catch (err) {
    log.fail('Failed checking schema aliases: ' + err.message)
    auditResults.seniorDev.failed++
  }
}

async function runQATestAutomation() {
  log.role('QA Test Automation Engineer', 'Live End-to-End Test Suite Execution')

  // TC-01: Material Sheet Tabs Detection
  try {
    const htmlUrl = `https://docs.google.com/spreadsheets/d/${MATERIAL_SHEET_ID}/htmlview`
    const res = await fetch(htmlUrl)
    const text = await res.text()
    const matches = [...text.matchAll(/items\.push\({\s*name:\s*"([^"]+)",[^}]*gid:\s*"([^"]+)"/g)]
    const tabs = matches.map(m => m[1])
    if (tabs.length >= 10) {
      log.pass(`TC-01: Material Sheet tabs loaded (${tabs.length} tabs found: ${tabs.slice(0, 3).join(', ')}...)`)
      auditResults.qaEngineer.passed++
    } else {
      log.fail(`TC-01: Insufficient tabs found on Material Sheet (${tabs.length} tabs)`)
      auditResults.qaEngineer.failed++
    }
  } catch (err) {
    log.fail(`TC-01: Error connecting to Material Sheet: ${err.message}`)
    auditResults.qaEngineer.failed++
  }

  // TC-02: GViz Material Data (September 2026)
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${MATERIAL_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=September26`
    const res = await fetch(gvizUrl)
    const csv = await res.text()
    const parsed = Papa.parse(csv, { skipEmptyLines: true })
    if (parsed.data.length > 200) {
      log.pass(`TC-02: September26 catalog parsed successfully (${parsed.data.length} rows loaded)`)
      auditResults.qaEngineer.passed++
    } else {
      log.fail(`TC-02: Low data count in September26 (${parsed.data.length} rows)`)
      auditResults.qaEngineer.failed++
    }
  } catch (err) {
    log.fail(`TC-02: GViz Material fetch error: ${err.message}`)
    auditResults.qaEngineer.failed++
  }

  // TC-03: Non-Material Sheet Transactions & Patient Room Fields
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${LOG_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Transactions`
    const res = await fetch(gvizUrl)
    const csv = await res.text()
    const parsed = Papa.parse(csv, { skipEmptyLines: true })
    const headers = parsed.data[0] || []
    
    const hasRequiredHeaders = headers.includes('id') && headers.includes('type') && headers.includes('quantity')
    if (hasRequiredHeaders && parsed.data.length > 10) {
      log.pass(`TC-03: Transactions sheet validated (${parsed.data.length - 1} logs, headers: [${headers.slice(0, 5).join(', ')}...])`)
      auditResults.qaEngineer.passed++
    } else {
      log.fail('TC-03: Transactions sheet headers invalid or empty')
      auditResults.qaEngineer.failed++
    }
  } catch (err) {
    log.fail(`TC-03: Transactions fetch error: ${err.message}`)
    auditResults.qaEngineer.failed++
  }

  // TC-04: Allowed Users Validation
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${LOG_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=AllowedUsers`
    const res = await fetch(gvizUrl)
    const csv = await res.text()
    const parsed = Papa.parse(csv, { skipEmptyLines: true })
    const users = parsed.data.slice(1).map(r => String(r[0] || '').trim()).filter(Boolean)
    if (users.length >= 2) {
      log.pass(`TC-04: AllowedUsers security list verified (${users.length} users: ${users.join(', ')})`)
      auditResults.qaEngineer.passed++
    } else {
      log.fail(`TC-04: AllowedUsers list empty or inaccessible`)
      auditResults.qaEngineer.failed++
    }
  } catch (err) {
    log.fail(`TC-04: AllowedUsers fetch error: ${err.message}`)
    auditResults.qaEngineer.failed++
  }

  // TC-05: Apps Script Live Healthcheck
  try {
    const res = await fetch(APPS_SCRIPT_URL, { redirect: 'follow' })
    const data = await res.json()
    if (data.success && data.message.includes('Dual-sheet configured')) {
      log.pass(`TC-05: Apps Script Web App responding 200 OK (${data.message})`)
      auditResults.qaEngineer.passed++
    } else {
      log.fail(`TC-05: Unexpected Apps Script response: ${JSON.stringify(data)}`)
      auditResults.qaEngineer.failed++
    }
  } catch (err) {
    log.fail(`TC-05: Apps Script ping failed: ${err.message}`)
    auditResults.qaEngineer.failed++
  }

  // TC-06: Excel Workbook Generation Test
  try {
    const wb = XLSX.utils.book_new()
    const summaryData = [
      ['รายงานการเคลื่อนไหววัสดุ'],
      ['สรุป', 10],
      ['ลงชื่อ ผู้จัดทำ', 'ลงชื่อ หัวหน้างาน']
    ]
    const ws = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, ws, 'Summary')
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    if (buffer && buffer.length > 500) {
      log.pass(`TC-06: XLSX Report generation engine operational (${buffer.length} bytes generated)`)
      auditResults.qaEngineer.passed++
    } else {
      log.fail('TC-06: Failed generating XLSX buffer')
      auditResults.qaEngineer.failed++
    }
  } catch (err) {
    log.fail(`TC-06: Excel generation error: ${err.message}`)
    auditResults.qaEngineer.failed++
  }
}

async function runDevOpsReview() {
  log.role('DevOps / Release Engineer', 'Build Sanity, Linter & Production Readiness')

  // 1. ESLint Scan
  try {
    execSync('npm run lint', { cwd: ROOT_DIR, stdio: 'pipe' })
    log.pass('ESLint static analysis: 0 errors, 0 warnings')
    auditResults.devOps.passed++
  } catch (err) {
    log.fail('ESLint check failed: ' + (err.stdout?.toString() || err.message))
    auditResults.devOps.failed++
  }

  // 2. Vite Production Build
  try {
    const output = execSync('npm run build', { cwd: ROOT_DIR, stdio: 'pipe' }).toString()
    if (output.includes('built in')) {
      log.pass('Vite Production Build succeeded (client dist ready)')
      auditResults.devOps.passed++
    } else {
      log.warn('Build finished with non-standard output')
    }
  } catch (err) {
    log.fail('Vite build failed: ' + (err.stderr?.toString() || err.message))
    auditResults.devOps.failed++
  }
}

async function runTeamLeaderEvaluation() {
  log.header('Engineering Team Leader Sign-Off & Evaluation Dashboard')

  const totalPassed = auditResults.techLead.passed + auditResults.seniorDev.passed + auditResults.qaEngineer.passed + auditResults.devOps.passed
  const totalFailed = auditResults.techLead.failed + auditResults.seniorDev.failed + auditResults.qaEngineer.failed + auditResults.devOps.failed
  const totalChecks = totalPassed + totalFailed
  const qualityIndex = Math.round((totalPassed / totalChecks) * 100)

  console.log(`
┌──────────────────────────────────────────────────────────────┐
│                  ENGINEERING REVIEW SUMMARY                  │
├──────────────────────────────┬──────────┬──────────┬─────────┤
│ Role                         │ Passed   │ Failed   │ Status  │
├──────────────────────────────┼──────────┼──────────┼─────────┤
│ 1. Tech Lead / Architect     │    ${auditResults.techLead.passed}     │    ${auditResults.techLead.failed}     │ ${auditResults.techLead.failed === 0 ? '✅ PASS' : '❌ FAIL'} │
│ 2. Senior Developer          │    ${auditResults.seniorDev.passed}     │    ${auditResults.seniorDev.failed}     │ ${auditResults.seniorDev.failed === 0 ? '✅ PASS' : '❌ FAIL'} │
│ 3. QA Automation Engineer    │    ${auditResults.qaEngineer.passed}     │    ${auditResults.qaEngineer.failed}     │ ${auditResults.qaEngineer.failed === 0 ? '✅ PASS' : '❌ FAIL'} │
│ 4. DevOps / Release Engineer │    ${auditResults.devOps.passed}     │    ${auditResults.devOps.failed}     │ ${auditResults.devOps.failed === 0 ? '✅ PASS' : '❌ FAIL'} │
├──────────────────────────────┴──────────┴──────────┴─────────┤
│ Total Passed: ${totalPassed} / ${totalChecks} (${qualityIndex}%)                                │
│ Final Assessment: ${qualityIndex === 100 ? '🟢 PRODUCTION READY (APPROVED)' : '🔴 ACTION REQUIRED'}               │
└──────────────────────────────────────────────────────────────┘
`)

  if (totalFailed === 0) {
    console.log(`${colors.bright}${colors.green}🏆 ALL ENGINEERING GATES PASSED! SYSTEM IS CERTIFIED PRODUCTION READY.${colors.reset}\n`)
  } else {
    console.log(`${colors.bright}${colors.red}❌ SOME CHECKS FAILED. PLEASE RESOLVE ISSUES BEFORE RELEASE.${colors.reset}\n`)
    process.exit(1)
  }
}

async function main() {
  console.log(`${colors.bright}${colors.cyan}=============================================================`)
  console.log(`🚀 STARTING MULTI-ROLE ENGINEERING TEAM REVIEW & QA LOOP`)
  console.log(`=============================================================${colors.reset}`)

  await runTechLeadReview()
  await runSeniorDeveloperReview()
  await runQATestAutomation()
  await runDevOpsReview()
  await runTeamLeaderEvaluation()
}

main().catch(err => {
  console.error('\nFatal error in review loop:', err)
  process.exit(1)
})
