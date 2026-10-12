"""Structural correctness tests. They are not proof of creative quality."""
import importlib.util
from pathlib import Path
import sys
import unittest
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'kaggle/experiments'))
from subject_cinematography import composite_frame,scene_geometry,contact_shadow


class SubjectCinematographyTests(unittest.TestCase):
    def setUp(self):
        self.source=np.full((64,96,3),140,dtype=np.uint8)
        self.mask=np.zeros((64,96),np.float32);self.mask[12:54,30:66]=1
        self.field=np.zeros((64,96,3),np.float32)
    def test_foreground_does_not_follow_background_exposure(self):
        bright,_=composite_frame(self.source,self.mask,self.field,.8)
        dark,_=composite_frame(self.source,self.mask,self.field,.1)
        np.testing.assert_array_equal(bright[self.mask==1],dark[self.mask==1])
        self.assertGreater(bright[2,2].mean(),dark[2,2].mean())
    def test_spatial_lighting_responds_to_subject_structure(self):
        incidence,rim=scene_geometry(self.mask)
        self.assertGreater(incidence[30,32],incidence[30,63])
        output,_=composite_frame(self.source,self.mask,self.field)
        self.assertGreater(output[30,32].mean(),output[30,63].mean())
        self.assertGreater(contact_shadow(self.mask).max(),0)
        self.assertEqual(output.shape,self.source.shape)
    def test_empty_mask_only_applies_background_layer(self):
        empty=np.zeros_like(self.mask)
        output,_=composite_frame(self.source,empty,self.field,.3)
        np.testing.assert_array_equal(output[20,20],output[30,30])


if __name__=='__main__':unittest.main()
