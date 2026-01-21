import type { UserScript } from '../services/user-scripts/types';

export const defaultUserScripts: UserScript[] = [
	{
		id: 'fade-in',
		name: 'Fade In',
		description: 'Gradually increases volume from 0 to max (15) across selected rows',
		code: `local minRow = selection.minRow
local maxRow = selection.maxRow
local totalRows = maxRow - minRow + 1

for i, row in ipairs(rows) do
    local relativeRow = row.rowIndex - minRow
    local progress = 1
    if totalRows > 1 then
        progress = relativeRow / (totalRows - 1)
    end
    row.volume = math.floor(progress * 15 + 0.5)
end`
	},
	{
		id: 'fade-out',
		name: 'Fade Out',
		description: 'Gradually decreases volume from max (15) to 0 across selected rows',
		code: `local minRow = selection.minRow
local maxRow = selection.maxRow
local totalRows = maxRow - minRow + 1

for i, row in ipairs(rows) do
    local relativeRow = row.rowIndex - minRow
    local progress = 1
    if totalRows > 1 then
        progress = relativeRow / (totalRows - 1)
    end
    row.volume = math.floor((1 - progress) * 15 + 0.5)
end`
	}
];
