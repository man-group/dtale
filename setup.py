#!/usr/bin/env python
from __future__ import print_function

import logging
import sys

from setuptools import find_packages, setup
from setuptools.command.test import test as TestCommand


def read_file(path):
    # if this fails on windows then add the following environment variable (PYTHONUTF8=1)
    with open(path) as contents:
        return contents.read()


# Convert Markdown to RST for PyPI
# http://stackoverflow.com/a/26737672
try:
    import pypandoc

    pypandoc_func = (
        pypandoc.convert_file if hasattr(pypandoc, "convert_file") else pypandoc.convert
    )
    long_description = pypandoc_func("DESCRIPTION.md", "rst")
except (IOError, ImportError, OSError):
    long_description = read_file("DESCRIPTION.md")


class PyTest(TestCommand):
    user_options = [("pytest-args=", "a", "Arguments to pass to py.test")]

    def initialize_options(self):
        TestCommand.initialize_options(self)
        self.pytest_args = []

    def finalize_options(self):
        TestCommand.finalize_options(self)
        self.test_args = []
        self.test_suite = True

    def run_tests(self):
        logging.basicConfig(
            format="%(asctime)s %(levelname)s %(name)s %(message)s", level="DEBUG"
        )

        # import here, cause outside the eggs aren't loaded
        import pytest
        import six

        args = (
            [self.pytest_args]
            if isinstance(self.pytest_args, six.string_types)
            else list(self.pytest_args)
        )
        args.extend(
            [
                "--cov",
                "dtale",
                "--cov-report",
                "xml",
                "--cov-report",
                "html",
                "--junitxml",
                "junit.xml",
                "-v",
            ]
        )
        errno = pytest.main(args)
        sys.exit(errno)


setup(
    name="dtale",
    version="2.9.1",
    author="MAN Alpha Technology",
    author_email="ManAlphaTech@man.com",
    description="Web Client for Visualizing Pandas Objects",
    license="LGPL",
    long_description=long_description,
    keywords=["numeric", "pandas", "visualization", "flask"],
    url="https://github.com/man-group/dtale",
    install_requires=read_file("requirements.txt"),
    extras_require={
        "arctic": ["arctic <= 1.79.4"],
        "dash-bio": [
            "dash-bio; python_version > '3.0'",
            "dash-bio==0.7.1; python_version == '2.7'",
        ],
        "r": ["rpy2; python_version > '3.0'"],
        "redis": ["redislite"],
        "streamlit": ["streamlit"],
        "swifter": ["swifter"],
        "tests": read_file("requirements-test.txt"),
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "License :: OSI Approved :: GNU Library or Lesser General Public License (LGPL)",
        "Operating System :: OS Independent",
        "Intended Audience :: Science/Research",
        "Programming Language :: Python",
        "Topic :: Scientific/Engineering",
        "Programming Language :: Python :: 2.7",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
    ],
    cmdclass={"test": PyTest},
    packages=find_packages(exclude=["tests*", "script*"]),
    package_data={
        "dtale": [
            "dash_application/components/*",
            "static/dist/*",
            "static/dash/*",
            "static/css/*",
            "static/fonts/*",
            "static/images/*",
            "static/images/**/*",
            "static/maps/*",
            "templates/**/*",
            "templates/**/**/*",
        ]
    },
    entry_points={
        "console_scripts": [
            "dtale = dtale.cli.script:main",
            "dtale-streamlit = dtale.cli.streamlit_script:main",
        ]
    },
    zip_safe=False,
)
