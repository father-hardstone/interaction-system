import React from 'react';

/**
 * Get all status tags for an interaction
 * @param {Object} interaction - The interaction object
 * @returns {Array} Array of tag objects with { label, className }
 */
export const getInteractionTags = (interaction) => {
    if (!interaction) return [];

    const tags = [];

    // Incomplete tag (highest priority - shows if incomplete and not completed)
    if (interaction.incomplete && !interaction.completed) {
        tags.push({
            label: 'Incomplete',
            className: 'bg-yellow-50 text-yellow-600 border-yellow-100'
        });
    }

    // Ongoing tag
    if (interaction.ongoing) {
        tags.push({
            label: 'Ongoing',
            className: 'bg-blue-50 text-blue-600 border-blue-100'
        });
    }

    // Completed tag
    if (interaction.completed) {
        tags.push({
            label: 'Completed',
            className: 'bg-emerald-50 text-emerald-600 border-emerald-100'
        });
    }

    // Closed tag
    if (interaction.closed) {
        tags.push({
            label: 'Closed',
            className: 'bg-slate-50 text-slate-500 border-slate-100'
        });
    }

    // Billed tag (check explicit billed field first, then fallback to serviceLines check)
    if (interaction.billed === true) {
        tags.push({
            label: 'Billed',
            className: 'bg-purple-50 text-purple-600 border-purple-100'
        });
    } else if (interaction.billed === undefined && interaction.serviceLines && interaction.serviceLines.length > 0) {
        // Fallback: check serviceLines for backward compatibility with old data
        const hasBilling = interaction.serviceLines.some(line => 
            (line.totalFee && line.totalFee > 0) || line.accountingNumber
        );
        if (hasBilling) {
            tags.push({
                label: 'Billed',
                className: 'bg-purple-50 text-purple-600 border-purple-100'
            });
        }
    }

    // Followup required tag (parent: this appointment requires followup)
    if ((interaction.followupRequired?.required) || (interaction.followup?.required)) {
        tags.push({
            label: 'Followup required',
            className: 'bg-orange-50 text-orange-600 border-orange-100'
        });
    }

    // Followup appointment tag (child: this IS a followup appointment)
    if (interaction.followup?.isFollowup) {
        tags.push({
            label: 'Followup appointment',
            className: 'bg-teal-50 text-teal-600 border-teal-100'
        });
    }

    return tags;
};

/**
 * Render interaction tags as JSX elements
 * @param {Object} interaction - The interaction object
 * @param {Object} options - Options for rendering
 * @param {string} options.size - Size class for tags ('text-xs' or 'text-xs')
 * @returns {Array} Array of JSX span elements
 */
export const renderInteractionTags = (interaction, options = {}) => {
    const { size = 'text-xs' } = options;
    const tags = getInteractionTags(interaction);

    return tags.map((tag, index) => (
        <span
            key={index}
            className={`${tag.className} border px-1 py-0.5 rounded ${size} font-semibold normal-case`}
        >
            {tag.label}
        </span>
    ));
};
