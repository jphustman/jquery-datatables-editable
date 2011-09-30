/**
 * Usage:
 *
 * 1. Install Jeditable: http://www.appelsiini.net/projects/jeditable
 * 2. Add the code below to your javascript.
 * 3. Call it like this:
 *
 * $('p').editable('/edit', {
 *   type:   'checkbox',
 *   cancel: 'Cancel',
 *   submit: 'OK',
 *   checkbox: { trueValue: 'Yes', falseValue: 'No' }
 * });
 *
 * Upon clicking on the <p>, it's content will be replaced by a checkbox.
 * If the text within the paragraph is 'Yes', the checkbox will be checked
 * by default, otherwise it will be unchecked.
 *
 * trueValue is submitted when the checkbox is checked and falseValue otherwise.
 *
 * Have fun!
 *
 * Peter BÃ¼cker (spam.naag@gmx.net)
 * http://www.pastie.org/893364
 */

$.editable.addInputType('checkbox', {
  element: function(settings, original) {
    $(this).append('<input type="checkbox"/>');
    var hidden = $('<input type="hidden"/>');
    $(this).append(hidden);
    return(hidden);
  },

  submit: function(settings, original) {
    settings = $.extend({ checkbox: {
      trueValue: '1',
      falseValue: '0'
    }}, settings);

    if ($(':checkbox', this).is(':checked')) {
      $(':hidden', this).val(settings.checkbox.trueValue);
    } else {
      $(':hidden', this).val(settings.checkbox.falseValue);
    }
  },

  content: function(data, settings, original) {
    settings = $.extend({ checkbox: {
      trueValue: '1',
      falseValue: '0'
    }}, settings);

    if (data == settings.checkbox.trueValue) {
      $(':checkbox', this).attr('checked', 'checked');
    } else {
      $(':checkbox', this).removeAttr('checked');
    }
  }
});

