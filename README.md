# crPMT
Front end for the Clinical Research Project Management Tool

Versioning convention:  [major releases].[new features/major fixes/].[minor fixes]

# Changelog

## [0.6.0dev] - 2026-01-06
- Replaced LS AAI login system with Microsoft Entra
- Code cleaning (removal of files unused from the crDSR)

## [0.5.1dev] - 2025-11-06
- Fixed a visual bug where when adding a study, certain dropdown fields looked like they already had a blank value selected

## [0.5.0dev] - 2025-11-06
### Global
- Changed many field/section names
- Improved links to previous level in view pages titles (added breadcrumbs)
- Visual improvements in all view pages
- Panels (e.g. studies in projects) are now expanded by default when adding a new item
### Project
- Added Name of the EU Project Coordinator field
### Study
- Added second dropdown field for Regulatory Framework if CTR or COMBINED is selected in the first dropdown
- Added total number of patients expected field (was displayed but not functional)
- Added Study Summary character limit (with remaining characters displayed)
- Replaced recruitment start and end fields with recruitment period, with number and unit fields
- Added total number of sites per country display view page
- Removed site count per CTU in study countries display, added count at study country level instead, added centres display and study CTUs are now links
### Study country
- Added initial regulatory submissions, amendments, other types of notification, and end of trial notifications
- Added display of CTUs and their services and sites
### Study CTU
- Added Lead CTU, contact name and SAS verification (moved from removed "togglable" CTU info display), list of services fields, as well as proper sections
### Centre
- Changed hospital field to a dropdown with addable items
- Changed site number field to a checkbox + text field if checkbox is checked
- Added expected number of patients field
- Removed recruitment greenlight field
### Other (technical) changes
- Fixed item type display when deleting an item from a list page
- Upgrade from Bootstrap 4 to 5
- Code cleaning

## [0.4.1dev] - 2025-08-26
- Modified some field names in project and study pages to match the specifications

## [0.4.0dev] - 2025-08-26
- Added all EuCos to the list of selectable persons of various fields, they are also associated to a country and have "EuCo" status
- Added person list page to modify persons info
- Project and study views display less info, with links to go to the next "level" of info (project -> study, study -> study country)
- Organised fields in project and study pages by section, following the specifications (and other interface improvements)
- Project: added public summary field, modified coordinator field to be a dropdown with organisation objects, removed services field
- Study: added sponsor organisation, sponsor country, medical fields, rare diseases, complex trial design, complex trial type, coordinating euco, coordinating country, services fields
- It is now possible to add and properly edit a single study
- Fixed some dropdown values in various fields

## [0.3.0dev] - 2025-07-10

- Added funding sources, total patients expected, coordinator, PI, cEuCo, and ECRIN services fields to projects
- Added trial registration, PI, sponsor, population, recruitment start, recruitment end, first patient in, last patient out, treatment and follow duration per patient, and treatment period per patient fields to studies
- Added centres in study CTUs (multiple centers per CTU) with site number, town, hospital, PI, patients expected, recruitment greenlight, MOV expected number, and first patient visit fields
- For funding sources, ECRIN services, and PI fields, it is possible to add and delete items from the list of options
- Remove submission and approval date fields from study countries
- Fixed issue where adding a project with multiple studies in a certain order would have them added in a different order than displayed
- Changed country order to sort by country name rather than country code
- Cleaned study status values list (e.g. `2_Running phase_Follow up` -> `Running phase: Follow up`)

## [0.2.2dev] - 2025-06-12

- Fixed not being able to edit/save individual study properly

## [0.2.1dev] - 2025-06-12

- Fixed country flag emojis not being displayed in Chromium-based browsers
- Fixed CTU fixed info display button opening the wrong panel when the same country appeared in 2 different studies

## [0.2.0dev] - 2025-06-11

- Added study CTUs
- Fixed project and study deletion from project and study list pages
- Removed extra notifications when saving to keep only one (when saving successfully)
- Improved app speed by only querying the DB for "static" data (countries, CTUs) once
 
## [0.1.0dev] - 2025-05-23

- Adding multiple studies in one project is now possible
- Improvements to form validation when saving, including scrolling to form error
- Added confirmation window on study deletion
- Improvements to project/study/study countries UI
- Deleting a study country is now possible
- Fixed/improved lead country field (was a checkbox not shared between countries before)
- Added full list of countries selectable in study countries
- Changed study status field to a dropdown list of the values currently mentioned in the specs sheet
- Added a changelog!
- Other minor QoL improvements
 
## [0.0.1(dev)] - 2025-03-18
 
- First prototype of the PMT
