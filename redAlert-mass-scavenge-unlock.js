/*
 * Script Name: Mass Scavenging Unlock
 * Version: v1.3.1
 * Last Updated: 2023-09-04
 * Author: RedAlert
 * Author URL: https://twscripts.dev/
 * Author Contact: redalert_tw (Discord)
 * Approved: t14525689
 * Approved Date: 2021-01-28
 * Mod: JawJaw
 */

/*--------------------------------------------------------------------------------------
 * This script can NOT be cloned and modified without permission from the script author.
 --------------------------------------------------------------------------------------*/

// User Input
if (typeof DEBUG !== 'boolean') DEBUG = false;

// Script Config
var scriptConfig = {
    scriptData: {
        prefix: 'massUnlockScav',
        name: 'Mass Scavenging Unlock',
        version: 'v1.3.1',
        author: 'RedAlert',
        authorUrl: 'https://twscripts.dev/',
        helpLink:
            'https://forum.tribalwars.net/index.php?threads/mass-scavenging-options-unlock.286619/',
    },
    translations: {
        en_DK: {
            'Mass Scavenging Unlock': 'Mass Scavenging Unlock',
            Help: 'Help',
            'Redirecting...': 'Redirecting...',
            'All scavenging options are unlocked!':
                'All scavenging options are unlocked!',
            'Start Mass Unlock': 'Start Mass Unlock',
            'Possible unlocks:': 'Possible unlocks:',
            'Village Name': 'Village Name',
            Actions: 'Actions',
            Unlock: 'Unlock',
            'Script finished working!': 'Script finished working!',
        },
    },
    allowedMarkets: [],
    allowedScreens: ['place'],
    allowedModes: ['scavenge_mass'],
    isDebug: DEBUG,
    enableCountApi: true,
};

$.getScript(
    `https://twscripts.dev/scripts/twSDK.js?url=${document.currentScript.src}`,
    async function () {
        // Initialize Library
        await twSDK.init(scriptConfig);
        const isValidScreen = twSDK.checkValidLocation('screen');
        const isValidMode = twSDK.checkValidLocation('mode');

        // Define main mass scav url
        if (game_data.player.sitter > 0) {
            URLReq = `game.php?t=${game_data.player.id}&screen=place&mode=scavenge_mass`;
        } else {
            URLReq = 'game.php?&screen=place&mode=scavenge_mass';
        }

        // check if we are on a valid screen
        if (isValidScreen && isValidMode) {
            initMain();
        } else {
            UI.InfoMessage(twSDK.tt('Redirecting...'));
            twSDK.redirectTo('place&mode=scavenge_mass');
        }

        // Main script logic
        function initMain() {
            let URLs = [];
            jQuery
                .get(URLReq, function () {
                    if (jQuery('.paged-nav-item').length > 0) {
                        amountOfPages = parseInt(
                            jQuery('.paged-nav-item')[
                            jQuery('.paged-nav-item').length - 1
                                ].href.match(/page=(\d+)/)[1]
                        );
                    } else {
                        amountOfPages = 0;
                    }
                    for (var i = 0; i <= amountOfPages; i++) {
                        URLs.push(URLReq + '&page=' + i);
                    }
                })
                .done(function () {
                    let arrayWithData = '[';

                    // Show progress bar and notify user
                    twSDK.startProgressBar(URLs.length);

                    twSDK.getAll(
                        URLs,
                        (index, data) => {
                            twSDK.updateProgressBar(index, URLs.length);

                            thisPageData = jQuery(data)
                                .find('script:contains("ScavengeMassScreen")')
                                .html()
                                .match(/\{.*\:\{.*\:.*\}\}/g)[2];
                            arrayWithData += thisPageData + ',';
                        },
                        () => {
                            arrayWithData = arrayWithData.substring(
                                0,
                                arrayWithData.length - 1
                            );
                            arrayWithData += ']';

                            const scavengingInfo = JSON.parse(arrayWithData);
                            const scavengeTable = [];

                            scavengingInfo.forEach((scavObj) => {
                                const { village_id, options } = scavObj;
                                const validOptions = [];
                                for (let [_, value] of Object.entries(
                                    options
                                )) {
                                    if (
                                        value.is_locked === true &&
                                        value.unlock_time === null
                                    ) {
                                        validOptions.push(value.base_id);
                                    }
                                }
                                if (validOptions.length > 0) {
                                    scavengeTable.push({
                                        village_id: village_id,
                                        option_id: validOptions.sort()[0],
                                        village: scavObj,
                                    });
                                }
                            });

                            if (scavengeTable.length === 0) {
                                UI.SuccessMessage(
                                    twSDK.tt(
                                        'All scavenging options are unlocked!'
                                    )
                                );
                            } else {
                                let htmlString = `
                                    <table class="ra-table ra-table-v3" width="100%">
                                        <thead>
                                            <th>
                                                ${twSDK.tt('Village Name')}
                                            </th>
                                            <th class="ra-tac">
                                                ${twSDK.tt('Actions')}
                                            </th>
                                        </thead>
                                        <tbody>
                                `;

                                scavengeTable.forEach((scavItem) => {
                                    const { option_id, village } = scavItem;
                                    const { village_id, village_name } =
                                        village;
                                    htmlString += `
                                    <tr data-row-village-id="${village_id}">
                                        <td>
                                            <a href="/game.php?screen=info_village&id=${village_id}" rel="noreferrer noopener" target="_blank">
                                                ${village_name}
                                            </a>
                                        </td>
                                        <td class="ra-tac">
                                            <a href="#" class="btn btn-single-scav" data-village-id="${village_id}" data-option-id="${option_id}">
                                                ${twSDK.tt(
                                        'Unlock'
                                    )} #${option_id}
                                            </a>
                                        </td>
                                    </tr>
                                `;
                                });

                                htmlString += `</tbody></table>`;

                                const content = `
                                    <div class="ra-mb15">
                                        <p><b>${twSDK.tt(
                                    'Possible unlocks:'
                                )}</b> ${scavengeTable.length}</p>
                                        <a href="javascript" class="btn btn-confirm-yes" id="startMassUnlock">
                                            ${twSDK.tt('Start Mass Unlock')}
                                        </a>
                                    </div>
                                    <p style="display:none;" class="ra-success-message ra-mb15">
                                        <b>${twSDK.tt(
                                    'Script finished working!'
                                )}</b>
                                    </p>
                                    <div class="ra-mb15 ra-table-container ra-villages-container">
                                        ${htmlString}
                                    </div>
                                `;

                                twSDK.renderFixedWidget(
                                    content,
                                    scriptConfig.scriptData.prefix,
                                    'ra-mass-unlock-scav'
                                );

                                // action handlers
                                unlockScavOption();

                                jQuery('#startMassUnlock').on(
                                    'click',
                                    function (e) {
                                        e.preventDefault();
                                        jQuery(this).attr(
                                            'disabled',
                                            'disabled'
                                        );
                                        scavengeTable.forEach(
                                            (scavengeItem, i) => {
                                                setTimeout(() => {
                                                    const {
                                                        village_id,
                                                        option_id,
                                                    } = scavengeItem;
                                                    TribalWars.post(
                                                        'scavenge_api',
                                                        {
                                                            ajaxaction:
                                                                'start_unlock',
                                                        },
                                                        {
                                                            village_id:
                                                            village_id,
                                                            option_id:
                                                            option_id,
                                                        }
                                                    );
                                                    jQuery(
                                                        `.ra-table tr[data-row-village-id="${village_id}"]`
                                                    ).fadeOut(250);

                                                    // when all is done
                                                    if (
                                                        scavengeTable.length ===
                                                        i + 1
                                                    ) {
                                                        jQuery(this).removeAttr(
                                                            'disabled'
                                                        );
                                                        jQuery(
                                                            '.ra-success-message'
                                                        ).show();
                                                        jQuery(
                                                            '.ra-villages-container'
                                                        ).fadeOut(250);
                                                    }
                                                }, 250 * i);
                                            }
                                        );
                                    }
                                );
                            }
                        },
                        (error) => {
                            console.error(error);
                        }
                    );
                });
        }

        // Helper: Unlock scavenging option
        function unlockScavOption() {
            jQuery('.btn-single-scav').on('click', function (e) {
                e.preventDefault();
                jQuery('.btn-single-scav').attr('disabled', 'disabled');
                const villageId = jQuery(this).attr('data-village-id');
                const optionId = jQuery(this).attr('data-option-id');

                TribalWars.post(
                    'scavenge_api',
                    { ajaxaction: 'start_unlock' },
                    {
                        village_id: villageId,
                        option_id: optionId,
                    }
                );

                setTimeout(() => {
                    jQuery('.btn-single-scav').removeAttr('disabled');
                }, 250);
                jQuery(this).parent().parent().fadeOut(250);
            });
        }
    }
);