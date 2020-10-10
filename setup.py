#!/usr/bin/env python
from __future__ import print_function

import logging
import sys

import six
from setuptools import find_packages, setup
from setuptools.command.test import test as TestCommand

# Convert Markdown to RST for PyPI
# http://stackoverflow.com/a/26737672
try:
    import pypandoc

    long_description = pypandoc.convert("README.md", "rst")
    changelog = pypandoc.convert("CHANGES.md", "rst")
except (IOError, ImportError, OSError):
    long_description = open("README.md").read()
    changelog = open("CHANGES.md").read()


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
    version="1.17.0",
    author="MAN Alpha Technology",
    author_email="ManAlphaTech@man.com",
    description="Web Client for Visualizing Pandas Objects",
    license="LGPL",
    long_description="\n".join((long_description, changelog)),
    keywords=["numeric", "pandas", "visualization", "flask"],
    url="https://github.com/man-group/dtale",
    install_requires=[
        "lz4<=2.2.1; python_version < '3.0'",
        "lz4; python_version > '3.0'",
        "dash>=1.5.0",
        "dash-bootstrap-components<=0.10.5; python_version < '3.0'",
        "dash-bootstrap-components; python_version > '3.0'",
        "dash-colorscales",
        "dash_daq",
        "Flask>=1.0",
        "Flask-Compress",
        "flask-ngrok; python_version > '3.0'",
        "future >= 0.14.0",
        "itsdangerous",
        "pandas",
        "requests",
        "scikit-learn >= '0.21.0",
        "scipy",
        "squarify",
        "statsmodels",
        "six",
        "xarray",
    ],
    extras_require={
        "arctic": ["arctic"],
        "r": ["rpy2<=2.8.6; python_version < '3.0'", "rpy2; python_version > '3.0'"],
        "redis": ["redislite"],
        "tests": ["ipython", "mock", "pytest", "pytest-cov", "pytest-server-fixtures"],
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
    entry_points={"console_scripts": ["dtale = dtale.cli.script:main"]},
    zip_safe=False,
)
