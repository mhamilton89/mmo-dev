# Create New Feature Script for Spec-Kit (PowerShell)
# Usage: .\create-new-feature.ps1 "feature-name" "Feature Display Name"

param(
    [Parameter(Mandatory=$true)]
    [string]$FeatureName,

    [Parameter(Mandatory=$false)]
    [string]$FeatureDisplayName = ""
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Get the project root (3 levels up from script location)
$ProjectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$SpecsDir = Join-Path $ProjectRoot ".specify\specs"
$TemplatesDir = Join-Path $ProjectRoot ".specify\templates"

# Function to get next feature number
function Get-NextFeatureNumber {
    $existingDirs = Get-ChildItem -Path $SpecsDir -Directory -ErrorAction SilentlyContinue

    if ($existingDirs.Count -eq 0) {
        return "001"
    }

    $maxNumber = 0
    foreach ($dir in $existingDirs) {
        if ($dir.Name -match '^(\d{3})-') {
            $num = [int]$matches[1]
            if ($num -gt $maxNumber) {
                $maxNumber = $num
            }
        }
    }

    $nextNumber = $maxNumber + 1
    return $nextNumber.ToString("000")
}

# Normalize feature name (lowercase, hyphens)
$FeatureName = $FeatureName.ToLower() -replace '\s+', '-' -replace '[^a-z0-9-]', ''

# Get display name
if ([string]::IsNullOrEmpty($FeatureDisplayName)) {
    $FeatureDisplayName = ($FeatureName -replace '-', ' ').ToLower()
    $FeatureDisplayName = (Get-Culture).TextInfo.ToTitleCase($FeatureDisplayName)
}

# Get next feature number
$FeatureNumber = Get-NextFeatureNumber
$FeatureId = "$FeatureNumber-$FeatureName"
$FeatureDir = Join-Path $SpecsDir $FeatureId

Write-Host ""
Write-Host "Creating new feature specification..." -ForegroundColor Cyan
Write-Host "  Feature ID: $FeatureId" -ForegroundColor Yellow
Write-Host "  Display Name: $FeatureDisplayName" -ForegroundColor Yellow
Write-Host ""

# Create feature directory
if (Test-Path $FeatureDir) {
    Write-Host "Error: Feature directory already exists: $FeatureDir" -ForegroundColor Red
    exit 1
}

New-Item -ItemType Directory -Path $FeatureDir | Out-Null
Write-Host "✓ Created directory: $FeatureDir" -ForegroundColor Green

# Create contracts subdirectory
$ContractsDir = Join-Path $FeatureDir "contracts"
New-Item -ItemType Directory -Path $ContractsDir | Out-Null
Write-Host "✓ Created contracts directory" -ForegroundColor Green

# Get current date
$CurrentDate = Get-Date -Format "yyyy-MM-dd"

# Copy and customize spec.md from template
$SpecTemplate = Join-Path $TemplatesDir "spec-template.md"
$SpecFile = Join-Path $FeatureDir "spec.md"

if (Test-Path $SpecTemplate) {
    $content = Get-Content $SpecTemplate -Raw
    $content = $content -replace '\[FEATURE_NAME\]', $FeatureDisplayName
    $content = $content -replace '\[FEATURE_ID\]', $FeatureId
    $content = $content -replace '\[DATE\]', $CurrentDate
    $content = $content -replace '\[Draft/In Progress/Implemented\]', 'Draft'
    $content = $content -replace '\[P1/P2/P3\]', 'P2'

    Set-Content -Path $SpecFile -Value $content
    Write-Host "✓ Created spec.md from template" -ForegroundColor Green
} else {
    Write-Host "⚠ Template not found, creating empty spec.md" -ForegroundColor Yellow
    Set-Content -Path $SpecFile -Value "# Feature Specification: $FeatureDisplayName`n`n**Feature ID:** $FeatureId`n"
}

# Create placeholder files
$PlaceholderFiles = @("plan.md", "tasks.md", "research.md", "data-model.md", "quickstart.md")

foreach ($file in $PlaceholderFiles) {
    $filePath = Join-Path $FeatureDir $file
    $fileName = $file -replace '\.md$', ''
    Set-Content -Path $filePath -Value "# $($fileName.ToUpper()): $FeatureDisplayName`n`n**Feature ID:** $FeatureId`n**Status:** Pending`n"
}

Write-Host "✓ Created placeholder files: plan.md, tasks.md, research.md, data-model.md, quickstart.md" -ForegroundColor Green

Write-Host ""
Write-Host "Feature specification created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Edit spec.md to define what you want to build" -ForegroundColor White
Write-Host "  2. Run /speckit.clarify to resolve ambiguities (optional)" -ForegroundColor White
Write-Host "  3. Run /speckit.plan to generate technical plan" -ForegroundColor White
Write-Host "  4. Run /speckit.tasks to create task breakdown" -ForegroundColor White
Write-Host "  5. Run /speckit.implement to build the feature" -ForegroundColor White
Write-Host ""
Write-Host "Specification location:" -ForegroundColor Cyan
Write-Host "  $SpecFile" -ForegroundColor Yellow
Write-Host ""
