# mypy: disable-error-code="no-redef"
from dataclasses import dataclass
from typing import Any, Dict, List

from jinja2 import Environment, Template


@dataclass
class RowWithGrammarElementFormObject:
    field: Any
    errors: Dict[str, List]
    jinja_environment: Environment

    def __post_init__(self):
        assert self.field is not None
        assert isinstance(
            self.jinja_environment, Environment
        ), self.jinja_environment

    def render(self):
        if self.field.is_new:
            template: Template = self.jinja_environment.get_template(
                "components/grammar_form/row_with_new_grammar_element/index.jinja"
            )
            rendered_template = template.render(form_object=self)
            return rendered_template
        else:
            template: Template = self.jinja_environment.get_template(
                "components/grammar_form/row_with_grammar_element/index.jinja"
            )
            rendered_template = template.render(form_object=self)
            return rendered_template

    def get_errors(self, field_name) -> List:
        return self.errors.get(field_name, [])
