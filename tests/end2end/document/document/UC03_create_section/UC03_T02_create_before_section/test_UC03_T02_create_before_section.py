from seleniumbase import BaseCase

from tests.end2end.end2end_test_setup import End2EndTestSetup
from tests.end2end.helpers.screens.document.form_edit_section import (
    Form_EditSection,
)
from tests.end2end.helpers.screens.document_tree.screen_document_tree import (
    Screen_DocumentTree,
)
from tests.end2end.server import SDocTestServer


class Test_UC03_T02_CreateBeforeSection(BaseCase):
    def test_01(self):
        test_setup = End2EndTestSetup(path_to_test_file=__file__)

        with SDocTestServer(
            input_path=test_setup.path_to_sandbox
        ) as test_server:
            self.open(test_server.get_host_and_port())

            screen_document_tree = Screen_DocumentTree(self)

            screen_document_tree.assert_on_screen()
            screen_document_tree.assert_contains_document("Document 1")

            screen_document = screen_document_tree.do_click_on_first_document()

            screen_document.assert_on_screen_document()
            screen_document.assert_header_document_title("Document 1")

            screen_document.assert_text("Hello world!")

            # In the first place now is the single section section_old
            existing_node_number = 1

            section_old = screen_document.get_section(existing_node_number)
            section_old.assert_section_title("Section B", "1")

            section_old_menu = section_old.do_open_node_menu()

            form_edit_section: Form_EditSection = (
                section_old_menu.do_node_add_section_above()
            )

            form_edit_section.do_fill_in_title("Section A")
            form_edit_section.do_fill_in_text("Section A text.")
            form_edit_section.do_form_submit()

            # In the first place now is the new section
            section_new = screen_document.get_section(existing_node_number)
            section_new.assert_section_title("Section A", "1")

            # The old section shifted to second place
            section_old = screen_document.get_section(existing_node_number + 1)
            section_old.assert_section_title("Section B", "2")

            screen_document.assert_toc_contains("Section A")
            screen_document.assert_toc_contains("Section B")

        assert test_setup.compare_sandbox_and_expected_output()
