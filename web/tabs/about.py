"""About Tab - App info and author bio"""
from pyscript import document
import sys
sys.path.append("web")

def initialize():
    about_html = """
    <div class="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mt-6">
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <div class="flex items-center justify-center sm:justify-start">
                <img src="https://media.licdn.com/dms/image/v2/D5603AQFrKxbhtu3eLw/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1666718490186?e=1770249600&v=beta&t=hM7q-KZ6murorcZL3NavpjqFZ19jC8pLkz26LPmGgbQ" alt="Stephen Heindel" class="w-24 h-24 rounded-full border-2 border-primary-500 shadow-sm">
            </div>

            <div class="sm:col-span-3">
                <h2 class="text-2xl font-bold mb-1 text-primary-600 dark:text-primary-400">AirTable Powertools</h2>
                <p class="text-gray-700 dark:text-gray-200 mb-3">
                    Open-source toolkit for analyzing, visualizing, and understanding Airtable base schemas — dependency mapping, formula introspection, and complexity analysis.
                </p>

                <div class="flex items-center gap-4 mb-2">
                    <div class="font-semibold text-gray-900 dark:text-gray-100">Stephen Heindel</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">Creator · Software Engineer</div>
                </div>

                <div class="flex items-center gap-4 mt-2">
                    <a href="https://www.linkedin.com/in/stephen-heindel/" target="_blank" rel="noopener" title="LinkedIn" class="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 hover:underline">
                        <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg" alt="LinkedIn" class="w-5 h-5 inline" />
                        <span class="ml-1">LinkedIn</span>
                    </a>
                    <a href="https://github.com/sheindel" target="_blank" rel="noopener" title="GitHub" class="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 hover:underline">
                        <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/github.svg" alt="GitHub" class="w-5 h-5 inline" />
                        <span class="ml-1">GitHub</span>
                    </a>
                    <a href="https://buymeacoffee.com/sheindel" target="_blank" rel="noopener" title="Buy Me a Coffee" class="inline-block">
                        <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" class="h-8 w-auto inline" />
                    </a>
                </div>
            </div>
        </div>

        <div class="mt-6 text-xs text-gray-500 dark:text-gray-400">
            &copy; 2026 AirTable Powertools · MIT License · Not affiliated with Airtable.
        </div>
    </div>
    """
    about_tab = document.querySelector("#about-tab")
    if about_tab:
        about_tab.innerHTML = about_html
    else:
        print("Error: About tab element not found in the document.")
    print("About tab initialized")
