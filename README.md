# crPMT
Front end for the Clinical Research Project Management Tool

Versioning convention:  [major releases].[new features/major fixes/].[minor fixes]

# Changelog

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
